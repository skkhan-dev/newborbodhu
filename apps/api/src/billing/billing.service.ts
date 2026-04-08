import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  Coupon,
  MembershipStatus,
  PaymentForType,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  RoleKey,
} from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";

import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMembershipOrderDto } from "./dto/create-membership-order.dto";
import { PaymentWebhookDto } from "./dto/payment-webhook.dto";
import { SimulateCheckoutSessionDto } from "./dto/simulate-checkout-session.dto";

type CheckoutGateway = "AMARPAY" | "PAYPAL";

type CheckoutSessionPayload = {
  paymentId: string;
  gateway: CheckoutGateway;
  exp: number;
};

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listPlans() {
    const plans = await this.prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { durationDays: "asc" }],
    });

    return plans.map((plan) => ({
      id: plan.id,
      code: plan.code,
      category: plan.category,
      nameEn: plan.nameEn,
      nameBn: plan.nameBn,
      durationDays: plan.durationDays,
      bdtPrice: Number(plan.bdtPrice),
      usdPrice: Number(plan.usdPrice),
      contactLimit: plan.contactLimit,
      messageEnabled: plan.messageEnabled,
      contactViewEnabled: plan.contactViewEnabled,
      highlightEnabled: plan.highlightEnabled,
      supportTier: plan.supportTier,
    }));
  }

  async previewMembershipOrder(userId: string | null, dto: CreateMembershipOrderDto) {
    const plan = await this.requirePlan(dto.membershipPlanId);
    const coupon = dto.couponCode
      ? await this.validateCoupon(dto.couponCode, userId)
      : null;
    const currency = dto.gateway === PaymentGateway.PAYPAL ? "USD" : "BDT";
    const subtotalAmount =
      currency === "USD" ? Number(plan.usdPrice) : Number(plan.bdtPrice);
    const discountAmount = coupon
      ? this.calculateCouponDiscount(coupon, subtotalAmount, currency)
      : 0;
    const finalAmount = Math.max(subtotalAmount - discountAmount, 0);

    return {
      plan: {
        id: plan.id,
        code: plan.code,
        nameEn: plan.nameEn,
        nameBn: plan.nameBn,
        durationDays: plan.durationDays,
      },
      gateway: dto.gateway,
      currency,
      subtotalAmount,
      discountAmount,
      finalAmount,
      coupon: coupon
        ? {
            id: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
          }
        : null,
      activationRule:
        dto.gateway === PaymentGateway.OFFICE || dto.gateway === PaymentGateway.MANUAL
          ? "admin_approval_required"
          : "gateway_confirmation_required",
    };
  }

  async createMembershipOrder(userId: string, dto: CreateMembershipOrderDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: {
          select: {
            role: true,
          },
        },
        memberProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user || !user.memberProfile) {
      throw new NotFoundException("Member account was not found.");
    }

    const memberProfileId = user.memberProfile.id;
    const preview = await this.previewMembershipOrder(userId, dto);
    const manualReviewRequired =
      dto.gateway === PaymentGateway.OFFICE || dto.gateway === PaymentGateway.MANUAL;

    const created = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          userId,
          actorType: RoleKey.MEMBER,
          actorId: memberProfileId,
          paymentForType: PaymentForType.MEMBERSHIP,
          gateway: dto.gateway,
          currency: preview.currency,
          subtotalAmount: preview.subtotalAmount,
          discountAmount: preview.discountAmount,
          finalAmount: preview.finalAmount,
          status: manualReviewRequired
            ? PaymentStatus.MANUAL_REVIEW
            : PaymentStatus.PENDING,
          metadataJson: {
            source: "membership_checkout",
            activationRule: preview.activationRule,
            couponCode: preview.coupon?.code ?? null,
          },
          paymentItems: {
            create: {
              itemType: "MEMBERSHIP_PLAN",
              itemId: dto.membershipPlanId,
              amount: preview.finalAmount,
            },
          },
        },
      });

      if (preview.coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: preview.coupon.id,
            userId,
            paymentId: payment.id,
            currency: preview.currency,
            subtotalAmount: preview.subtotalAmount,
            discountAmount: preview.discountAmount,
            finalAmount: preview.finalAmount,
          },
        });
      }

      const membership = await tx.membership.create({
        data: {
          userId,
          memberProfileId,
          membershipPlanId: dto.membershipPlanId,
          status: MembershipStatus.PENDING,
          sourcePaymentId: payment.id,
        },
        include: {
          membershipPlan: true,
        },
      });

      return {
        payment,
        membership,
      };
    });

    return {
      payment: this.toPaymentPayload(created.payment),
      membership: {
        id: created.membership.id,
        status: created.membership.status,
        membershipPlan: {
          id: created.membership.membershipPlan.id,
          code: created.membership.membershipPlan.code,
          nameEn: created.membership.membershipPlan.nameEn,
          durationDays: created.membership.membershipPlan.durationDays,
        },
      },
      nextAction:
        dto.gateway === PaymentGateway.AMARPAY || dto.gateway === PaymentGateway.PAYPAL
          ? "redirect_to_gateway"
          : "await_admin_approval",
      checkout:
        dto.gateway === PaymentGateway.AMARPAY || dto.gateway === PaymentGateway.PAYPAL
          ? this.buildCheckoutSession({
              paymentId: created.payment.id,
              gateway: dto.gateway,
              preferredLocale: user.preferredLocale,
              currency: preview.currency,
              amount: preview.finalAmount,
              planName: preview.plan.nameEn,
            })
          : null,
    };
  }

  async simulateCheckoutSession(dto: SimulateCheckoutSessionDto) {
    const session = this.verifyCheckoutSessionToken(dto.token);
    const payment = await this.prisma.payment.findUnique({
      where: {
        id: session.paymentId,
      },
      select: {
        id: true,
        finalAmount: true,
      },
    });

    if (!payment) {
      throw new NotFoundException("Checkout session payment was not found.");
    }

    const configuredSignature = this.configService.get<string>("PAYMENT_WEBHOOK_SECRET");

    const result = await this.confirmGatewayPayment(session.gateway, {
      paymentId: session.paymentId,
      gatewayReference:
        dto.gatewayReference?.trim() ||
        `SIM-${session.gateway}-${Date.now()}`,
      status: dto.status === "SUCCESS" ? "SUCCESS" : "FAILED",
      amount: payment.finalAmount.toString(),
      signature: configuredSignature,
    });

    return {
      ...result,
      simulated: true,
    };
  }

  async getMembershipStatus(userId: string) {
    const activeMembership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
      },
      include: {
        membershipPlan: true,
      },
      orderBy: { endsAt: "desc" },
    });

    if (!activeMembership) {
      return {
        membership: null,
        contactsUsed: 0,
        contactsRemaining: 0,
        contactLimit: 0,
        canViewContacts: false,
        canMessage: false,
      };
    }

    const contactsUsed = await this.prisma.contactUnlock.count({
      where: { membershipId: activeMembership.id },
    });

    const limit = activeMembership.membershipPlan.contactLimit;

    return {
      membership: {
        id: activeMembership.id,
        status: activeMembership.status,
        planName: activeMembership.membershipPlan.nameEn,
        planCode: activeMembership.membershipPlan.code,
        supportTier: activeMembership.membershipPlan.supportTier,
        startsAt: activeMembership.startsAt?.toISOString() ?? null,
        endsAt: activeMembership.endsAt?.toISOString() ?? null,
      },
      contactsUsed,
      contactsRemaining: limit > 0 ? Math.max(0, limit - contactsUsed) : -1, // -1 = unlimited
      contactLimit: limit,
      canViewContacts: activeMembership.membershipPlan.contactViewEnabled,
      canMessage: activeMembership.membershipPlan.messageEnabled,
    };
  }

  async listMyOrders(userId: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        userId,
        paymentForType: PaymentForType.MEMBERSHIP,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        paymentItems: true,
        couponRedemptions: {
          include: {
            coupon: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    return payments.map((payment) => this.toPaymentPayload(payment));
  }

  async listManualReviewPayments() {
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentForType: PaymentForType.MEMBERSHIP,
        status: PaymentStatus.MANUAL_REVIEW,
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        paymentItems: true,
      },
    });

    return payments.map((payment) => this.toPaymentPayload(payment));
  }

  async approveManualPayment(paymentId: string, adminUserId: string, notes?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        memberships: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    if (!payment || payment.status !== PaymentStatus.MANUAL_REVIEW) {
      throw new NotFoundException("Manual-review payment was not found.");
    }

    const approvedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.MANUAL_APPROVED,
          approvedByAdminId: adminUserId,
          approvedAt,
          metadataJson: {
            ...(typeof payment.metadataJson === "object" && payment.metadataJson
              ? payment.metadataJson
              : {}),
            manualReviewNotes: notes ?? null,
          },
        },
      });

      for (const membership of payment.memberships) {
        const startsAt = approvedAt;
        const endsAt = new Date(startsAt);
        endsAt.setDate(endsAt.getDate() + membership.membershipPlan.durationDays);

        await tx.membership.update({
          where: { id: membership.id },
          data: {
            status: MembershipStatus.ACTIVE,
            startsAt,
            endsAt,
          },
        });
      }
    });

    return {
      success: true,
      paymentId,
      status: PaymentStatus.MANUAL_APPROVED,
    };
  }

  async rejectManualPayment(paymentId: string, adminUserId: string, notes?: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        memberships: true,
      },
    });

    if (!payment || payment.status !== PaymentStatus.MANUAL_REVIEW) {
      throw new NotFoundException("Manual-review payment was not found.");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.MANUAL_REJECTED,
          approvedByAdminId: adminUserId,
          approvedAt: new Date(),
          metadataJson: {
            ...(typeof payment.metadataJson === "object" && payment.metadataJson
              ? payment.metadataJson
              : {}),
            manualReviewNotes: notes ?? null,
          },
        },
      });

      await tx.membership.updateMany({
        where: {
          sourcePaymentId: payment.id,
        },
        data: {
          status: MembershipStatus.CANCELLED,
        },
      });
    });

    return {
      success: true,
      paymentId,
      status: PaymentStatus.MANUAL_REJECTED,
    };
  }

  async confirmGatewayPayment(
    gateway: PaymentGateway,
    dto: PaymentWebhookDto,
  ) {
    this.validateWebhookSignature(dto.signature);

    const payment = await this.prisma.payment.findFirst({
      where: {
        gateway,
        OR: [
          dto.paymentId ? { id: dto.paymentId } : undefined,
          dto.gatewayReference
            ? { gatewayReference: dto.gatewayReference }
            : undefined,
        ].filter(Boolean) as Prisma.PaymentWhereInput[],
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        memberships: {
          include: {
            membershipPlan: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException("Payment was not found for this gateway callback.");
    }

    if (
      payment.status === PaymentStatus.PAID ||
      payment.status === PaymentStatus.MANUAL_APPROVED
    ) {
      return {
        success: true,
        paymentId: payment.id,
        status: payment.status,
        idempotent: true,
      };
    }

    const isSuccess = ["SUCCESS", "PAID", "COMPLETED", "OK"].includes(dto.status);

    if (!isSuccess) {
      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            gatewayReference: dto.gatewayReference ?? payment.gatewayReference,
            metadataJson: {
              ...(typeof payment.metadataJson === "object" && payment.metadataJson
                ? payment.metadataJson
                : {}),
              webhookStatus: dto.status,
            },
          },
        });

        await tx.membership.updateMany({
          where: {
            sourcePaymentId: payment.id,
            status: MembershipStatus.PENDING,
          },
          data: {
            status: MembershipStatus.CANCELLED,
          },
        });
      });

      return {
        success: true,
        paymentId: payment.id,
        status: PaymentStatus.FAILED,
      };
    }

    const activatedPayment = await this.prisma.$transaction(async (tx) => {
      const approvedAt = new Date();
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.PAID,
          approvedAt,
          gatewayReference: dto.gatewayReference ?? payment.gatewayReference,
          metadataJson: {
            ...(typeof payment.metadataJson === "object" && payment.metadataJson
              ? payment.metadataJson
              : {}),
            webhookStatus: dto.status,
            amount: dto.amount ?? null,
          },
        },
      });

      for (const membership of payment.memberships) {
        const startsAt = approvedAt;
        const endsAt = new Date(startsAt);
        endsAt.setDate(endsAt.getDate() + membership.membershipPlan.durationDays);

        await tx.membership.update({
          where: {
            id: membership.id,
          },
          data: {
            status: MembershipStatus.ACTIVE,
            startsAt,
            endsAt,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: "PAYMENT_CONFIRMED",
          targetType: "Payment",
          targetId: payment.id,
          description: `${gateway} webhook confirmed payment`,
          metadataJson: {
            webhookStatus: dto.status,
            gatewayReference: dto.gatewayReference ?? null,
          },
        },
      });

      return updatedPayment;
    });

    if (payment.user?.email) {
      await this.notificationsService.queueEmail({
        userId: payment.user.id,
        recipientEmail: payment.user.email,
        templateKey: "PAYMENT_CONFIRMED",
        subject: "Your Borbodhu membership payment is confirmed",
        bodyJson: {
          paymentId: payment.id,
          gateway,
          status: PaymentStatus.PAID,
        },
      });
    }

    return {
      success: true,
      paymentId: activatedPayment.id,
      status: activatedPayment.status,
    };
  }

  private async requirePlan(membershipPlanId: string) {
    const plan = await this.prisma.membershipPlan.findUnique({
      where: { id: membershipPlanId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException("Membership plan was not found.");
    }

    return plan;
  }

  private async validateCoupon(couponCode: string, userId: string | null) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: couponCode.trim().toUpperCase() },
    });

    if (!coupon || !coupon.isActive) {
      throw new BadRequestException("Coupon code is not valid.");
    }

    const now = new Date();

    if (coupon.startsAt && coupon.startsAt > now) {
      throw new BadRequestException("Coupon is not active yet.");
    }

    if (coupon.expiresAt && coupon.expiresAt < now) {
      throw new BadRequestException("Coupon has expired.");
    }

    const [totalUses, userUses] = await Promise.all([
      this.prisma.couponRedemption.count({
        where: { couponId: coupon.id },
      }),
      userId
        ? this.prisma.couponRedemption.count({
            where: {
              couponId: coupon.id,
              userId,
            },
          })
        : Promise.resolve(0),
    ]);

    if (coupon.maxTotalUses !== null && totalUses >= coupon.maxTotalUses) {
      throw new BadRequestException("Coupon usage limit has been reached.");
    }

    if (
      userId &&
      coupon.maxUsesPerUser !== null &&
      userUses >= coupon.maxUsesPerUser
    ) {
      throw new BadRequestException("Coupon usage limit for this account is reached.");
    }

    return coupon;
  }

  private calculateCouponDiscount(
    coupon: Coupon,
    subtotalAmount: number,
    currency: string,
  ) {
    if (coupon.currencyScope && coupon.currencyScope !== currency) {
      throw new BadRequestException(
        `Coupon is not valid for ${currency} payments.`,
      );
    }

    if (coupon.discountType === "PERCENT" && coupon.percent !== null) {
      return Number(((subtotalAmount * Number(coupon.percent)) / 100).toFixed(2));
    }

    if (coupon.amount !== null) {
      return Math.min(Number(coupon.amount), subtotalAmount);
    }

    return 0;
  }

  private validateWebhookSignature(signature?: string) {
    const configuredSecret = this.configService.get<string>("PAYMENT_WEBHOOK_SECRET");

    if (!configuredSecret) {
      return;
    }

    if (!signature || signature !== configuredSecret) {
      throw new BadRequestException("Webhook signature is invalid.");
    }
  }

  private buildCheckoutSession(input: {
    paymentId: string;
    gateway: CheckoutGateway;
    preferredLocale: string | null | undefined;
    currency: string;
    amount: number;
    planName: string;
  }) {
    const ttlMinutes =
      this.configService.get<number>("CHECKOUT_SESSION_TTL_MINUTES") ?? 30;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);
    const token = this.signCheckoutSessionToken({
      paymentId: input.paymentId,
      gateway: input.gateway,
      exp: expiresAt.getTime(),
    });
    const webAppUrl = this.configService.get<string>("WEB_APP_URL") ?? "http://localhost:3000";
    const localePrefix = input.preferredLocale === "BN" ? "/bn" : "/en";
    const checkoutUrl = new URL(`${localePrefix}/checkout/simulate`, webAppUrl);

    checkoutUrl.searchParams.set("token", token);
    checkoutUrl.searchParams.set("gateway", input.gateway);
    checkoutUrl.searchParams.set("amount", input.amount.toFixed(2));
    checkoutUrl.searchParams.set("currency", input.currency);
    checkoutUrl.searchParams.set("plan", input.planName);

    return {
      mode: "SIMULATED" as const,
      provider: input.gateway === PaymentGateway.AMARPAY ? "aamarPay" : "PayPal",
      gateway: input.gateway,
      checkoutUrl: checkoutUrl.toString(),
      expiresAt: expiresAt.toISOString(),
    };
  }

  private signCheckoutSessionToken(payload: CheckoutSessionPayload) {
    const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = createHmac("sha256", this.getCheckoutSigningSecret())
      .update(body)
      .digest("base64url");

    return `${body}.${signature}`;
  }

  private verifyCheckoutSessionToken(token: string): CheckoutSessionPayload {
    const [body, signature] = token.trim().split(".");

    if (!body || !signature) {
      throw new BadRequestException("Checkout session token is invalid.");
    }

    const expectedSignature = createHmac("sha256", this.getCheckoutSigningSecret())
      .update(body)
      .digest("base64url");
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      throw new BadRequestException("Checkout session token signature is invalid.");
    }

    let payload: CheckoutSessionPayload;

    try {
      payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as CheckoutSessionPayload;
    } catch {
      throw new BadRequestException("Checkout session token payload is invalid.");
    }

    if (
      !payload.paymentId ||
      (payload.gateway !== PaymentGateway.AMARPAY &&
        payload.gateway !== PaymentGateway.PAYPAL)
    ) {
      throw new BadRequestException("Checkout session token is invalid.");
    }

    if (!payload.exp || payload.exp < Date.now()) {
      throw new BadRequestException("Checkout session has expired.");
    }

    return payload;
  }

  private getCheckoutSigningSecret() {
    return (
      this.configService.get<string>("PAYMENT_WEBHOOK_SECRET") ??
      this.configService.get<string>("JWT_SECRET") ??
      "borbodhu-dev-checkout-secret"
    );
  }

  private toPaymentPayload(payment: any) {
    return {
      id: payment.id,
      user: "user" in payment ? payment.user : undefined,
      paymentForType: payment.paymentForType,
      gateway: payment.gateway,
      currency: payment.currency,
      subtotalAmount: Number(payment.subtotalAmount),
      discountAmount: Number(payment.discountAmount),
      finalAmount: Number(payment.finalAmount),
      status: payment.status,
      createdAt: payment.createdAt,
      approvedAt: payment.approvedAt,
      paymentItems: "paymentItems" in payment ? payment.paymentItems : undefined,
      couponRedemptions:
        "couponRedemptions" in payment
          ? payment.couponRedemptions?.map((redemption: any) => ({
              code: redemption.coupon.code,
              discountAmount: Number(redemption.discountAmount),
            }))
          : undefined,
    };
  }
}
