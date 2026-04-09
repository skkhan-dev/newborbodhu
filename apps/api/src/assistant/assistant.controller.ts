import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthActor } from "../common/types/auth-actor.type";
import { AssistantService } from "./assistant.service";
import { QueryAssistantDto } from "./dto/query-assistant.dto";

@Controller("assistant")
@UseGuards(AuthGuard, RolesGuard)
@Roles(
  RoleKey.MEMBER,
  RoleKey.ADMIN,
  RoleKey.SUPER_ADMIN,
  RoleKey.GHOTOK,
  RoleKey.VENDOR,
)
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post("query")
  queryAssistant(@CurrentActor() actor: AuthActor, @Body() dto: QueryAssistantDto) {
    return this.assistantService.query(actor, dto);
  }
}
