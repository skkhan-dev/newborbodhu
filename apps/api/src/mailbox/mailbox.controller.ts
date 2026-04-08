import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { RoleKey } from "@prisma/client";

import { CurrentActor } from "../common/decorators/current-actor.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { AuthActor } from "../common/types/auth-actor.type";
import { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { MailboxService } from "./mailbox.service";

@Controller("mailbox")
@UseGuards(AuthGuard, RolesGuard)
@Roles(RoleKey.MEMBER)
export class MailboxController {
  constructor(private readonly mailboxService: MailboxService) {}

  @Get("conversations")
  listConversations(@CurrentActor() actor: AuthActor) {
    return this.mailboxService.listConversations(actor);
  }

  @Get("conversations/:conversationId/messages")
  getMessages(
    @CurrentActor() actor: AuthActor,
    @Param("conversationId") conversationId: string,
  ) {
    return this.mailboxService.getConversationMessages(actor, conversationId);
  }

  @Post("conversations/direct")
  createDirectConversation(
    @CurrentActor() actor: AuthActor,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.mailboxService.createDirectConversation(
      actor,
      dto.targetMemberProfileId,
    );
  }

  @Post("conversations/:conversationId/messages")
  sendMessage(
    @CurrentActor() actor: AuthActor,
    @Param("conversationId") conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.mailboxService.sendMessage(actor, conversationId, dto.body);
  }

  @Post("conversations/:conversationId/read")
  markRead(
    @CurrentActor() actor: AuthActor,
    @Param("conversationId") conversationId: string,
  ) {
    return this.mailboxService.markConversationRead(actor, conversationId);
  }
}
