import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleKey } from "@prisma/client";

import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthActor } from "../types/auth-actor.type";

type RequestWithActor = {
  actor?: AuthActor;
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<RoleKey[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = request.actor;

    if (!actor) {
      throw new ForbiddenException("Authenticated actor is required.");
    }

    const actorRoles = new Set(actor.roles);

    if (actorRoles.has(RoleKey.SUPER_ADMIN)) {
      if (
        requiredRoles.some(
          (role) => role === RoleKey.ADMIN || role === RoleKey.SUPER_ADMIN,
        )
      ) {
        return true;
      }
    }

    if (!requiredRoles.some((role) => actorRoles.has(role))) {
      throw new ForbiddenException("You do not have access to this resource.");
    }

    return true;
  }
}
