import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { LocaleKey, Prisma, RoleKey } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { TrackProductEventDto } from "./dto/track-product-event.dto";

const ROLE_PRIORITY: RoleKey[] = [
  RoleKey.SUPER_ADMIN,
  RoleKey.ADMIN,
  RoleKey.VENDOR,
  RoleKey.GHOTOK,
  RoleKey.MEMBER,
];

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async trackEvent(
    authorization: string | undefined,
    dto: TrackProductEventDto,
  ) {
    const actor = await this.resolveActorFromAuthorization(authorization);

    await this.prisma.productEvent.create({
      data: {
        userId: actor?.userId,
        actorRole: actor?.actorRole ?? null,
        anonymousId: dto.anonymousId?.trim() || null,
        sessionId: dto.sessionId?.trim() || null,
        platform: dto.platform,
        locale: dto.locale ?? actor?.preferredLocale ?? null,
        eventName: dto.eventName,
        pagePath: dto.pagePath?.trim() || null,
        screenName: dto.screenName?.trim() || null,
        referrerPath: dto.referrerPath?.trim() || null,
        entityType: dto.entityType?.trim() || null,
        entityId: dto.entityId?.trim() || null,
        metadataJson:
          (dto.metadataJson as Prisma.InputJsonValue | undefined) ?? undefined,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : undefined,
      },
    });

    return {
      success: true,
    };
  }

  async getSummary(days = 30) {
    const normalizedDays = Math.max(1, Math.min(days, 90));
    const now = new Date();
    const from = new Date(now.getTime() - normalizedDays * 24 * 60 * 60 * 1000);
    const where: Prisma.ProductEventWhereInput = {
      occurredAt: {
        gte: from,
      },
    };

    const [
      totalEvents,
      signedInUsers,
      anonymousVisitors,
      groupedByEvent,
      groupedByPlatform,
      groupedByLocale,
    ] = await Promise.all([
      this.prisma.productEvent.count({ where }),
      this.prisma.productEvent.findMany({
        where: {
          ...where,
          userId: {
            not: null,
          },
        },
        distinct: ["userId"],
        select: {
          userId: true,
        },
      }),
      this.prisma.productEvent.findMany({
        where: {
          ...where,
          anonymousId: {
            not: null,
          },
        },
        distinct: ["anonymousId"],
        select: {
          anonymousId: true,
        },
      }),
      this.prisma.productEvent.groupBy({
        by: ["eventName"],
        where,
        _count: {
          _all: true,
        },
      }),
      this.prisma.productEvent.groupBy({
        by: ["platform"],
        where,
        _count: {
          _all: true,
        },
      }),
      this.prisma.productEvent.groupBy({
        by: ["locale"],
        where,
        _count: {
          _all: true,
        },
      }),
    ]);

    const eventCounts = Object.fromEntries(
      groupedByEvent.map((item) => [item.eventName, item._count._all]),
    ) as Record<string, number>;

    return {
      range: {
        days: normalizedDays,
        from: from.toISOString(),
        to: now.toISOString(),
      },
      totals: {
        events: totalEvents,
        signedInUsers: signedInUsers.length,
        anonymousVisitors: anonymousVisitors.length,
      },
      keyEvents: {
        pageViews: eventCounts.PAGE_VIEW ?? 0,
        loginSuccesses: eventCounts.LOGIN_SUCCEEDED ?? 0,
        memberSignups: eventCounts.MEMBER_SIGNUP_COMPLETED ?? 0,
        vendorSignups: eventCounts.VENDOR_SIGNUP_COMPLETED ?? 0,
        vendorLeads: eventCounts.VENDOR_LEAD_SUBMITTED ?? 0,
        checkoutStarts: eventCounts.MEMBERSHIP_CHECKOUT_STARTED ?? 0,
        paymentRedirects: eventCounts.PAYMENT_REDIRECT_STARTED ?? 0,
        paymentCompletions: eventCounts.PAYMENT_COMPLETED ?? 0,
      },
      byPlatform: groupedByPlatform.map((item) => ({
        platform: item.platform,
        count: item._count._all,
      })),
      byLocale: groupedByLocale.map((item) => ({
        locale: item.locale ?? "UNKNOWN",
        count: item._count._all,
      })),
      topEvents: groupedByEvent
        .map((item) => ({
          eventName: item.eventName,
          count: item._count._all,
        }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 8),
    };
  }

  private async resolveActorFromAuthorization(authorization?: string) {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);

      if (!payload.sub) {
        return null;
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: payload.sub,
        },
        select: {
          id: true,
          preferredLocale: true,
          roles: {
            select: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      const roles = user.roles.map((role) => role.role);

      return {
        userId: user.id,
        preferredLocale: user.preferredLocale,
        actorRole:
          ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null,
      };
    } catch {
      return null;
    }
  }
}
