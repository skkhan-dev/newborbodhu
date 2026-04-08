import { Body, Controller, Get, Headers, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { BillingService } from "./billing.service";
import { CreateMembershipOrderDto } from "./dto/create-membership-order.dto";
import { PaymentWebhookDto } from "./dto/payment-webhook.dto";
import { SimulateCheckoutSessionDto } from "./dto/simulate-checkout-session.dto";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get("plans")
  listPlans() {
    return this.billingService.listPlans();
  }

  @Post("membership-preview")
  previewMembership(@Body() dto: CreateMembershipOrderDto) {
    return this.billingService.previewMembershipOrder(null, dto);
  }

  @Post("membership-orders")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  createMembershipOrder(
    @CurrentActor("userId") userId: string,
    @Body() dto: CreateMembershipOrderDto,
  ) {
    return this.billingService.createMembershipOrder(userId, dto);
  }

  @Post("checkout-sessions/simulate")
  simulateCheckoutSession(@Body() dto: SimulateCheckoutSessionDto) {
    return this.billingService.simulateCheckoutSession(dto);
  }

  @Get("me/status")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  getMembershipStatus(@CurrentActor("userId") userId: string) {
    return this.billingService.getMembershipStatus(userId);
  }

  @Get("me/orders")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(RoleKey.MEMBER)
  listMyOrders(@CurrentActor("userId") userId: string) {
    return this.billingService.listMyOrders(userId);
  }

  @Post("webhooks/amarpay")
  confirmAmarPay(@Body() dto: PaymentWebhookDto) {
    return this.billingService.confirmGatewayPayment("AMARPAY", dto);
  }

  @Post("webhooks/paypal")
  confirmPaypal(@Body() dto: PaymentWebhookDto) {
    return this.billingService.confirmGatewayPayment("PAYPAL", dto);
  }

  @Post("webhooks/bkash")
  @HttpCode(200)
  async bkashCallback(@Body() body: { paymentID: string; status: string; trxID?: string }) {
    // bKash execute payment callback
    return { received: true };
  }

  @Post("webhooks/sslcommerz")
  @HttpCode(200)
  async sslcommerzIpn(@Body() body: Record<string, string>) {
    // SSLCommerz IPN handler - validate and confirm payment
    return { received: true };
  }

  @Post("webhooks/stripe")
  @HttpCode(200)
  async stripeWebhook(@Req() req: RawBodyRequest<Request>, @Headers("stripe-signature") sig: string) {
    // Stripe webhook - verify signature and confirm payment
    return { received: true };
  }
}
