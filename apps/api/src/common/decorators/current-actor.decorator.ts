import { createParamDecorator, ExecutionContext } from "@nestjs/common";

import { AuthActor } from "../types/auth-actor.type";

export const CurrentActor = createParamDecorator(
  (data: keyof AuthActor | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ actor?: AuthActor }>();
    const actor = request.actor;

    if (!actor) {
      return undefined;
    }

    return data ? actor[data] : actor;
  },
);
