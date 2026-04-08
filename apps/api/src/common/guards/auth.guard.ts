import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { AuthActor } from "../types/auth-actor.type";

type RequestWithActor = {
  headers: Record<string, string | string[] | undefined>;
  actor?: AuthActor;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const authorization = request.headers.authorization;

    if (!authorization || Array.isArray(authorization)) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Bearer token is required.");
    }

    let payload: { sub?: string };

    try {
      payload = await this.jwtService.verifyAsync<{ sub?: string }>(token);
    } catch {
      throw new UnauthorizedException("Access token is invalid or expired.");
    }

    if (!payload.sub) {
      throw new UnauthorizedException("Access token payload is invalid.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: true,
        memberProfile: { select: { id: true } },
        ghotokProfile: { select: { id: true } },
        vendorProfile: { select: { id: true } },
        adminProfile: { select: { id: true, isSuperAdmin: true } },
      },
    });

    if (!user || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException("User account is unavailable.");
    }

    request.actor = {
      userId: user.id,
      email: user.email,
      preferredLocale: user.preferredLocale,
      status: user.status,
      roles: user.roles.map((role) => role.role),
      memberProfileId: user.memberProfile?.id,
      ghotokProfileId: user.ghotokProfile?.id,
      vendorProfileId: user.vendorProfile?.id,
      adminUserId: user.adminProfile?.id,
      isSuperAdmin: user.adminProfile?.isSuperAdmin ?? false,
    };

    return true;
  }
}
