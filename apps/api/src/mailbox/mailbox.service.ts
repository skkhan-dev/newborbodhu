import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  ConversationType,
  InteractionStatus,
  InteractionType,
  MembershipStatus,
  MessageType,
  Prisma,
  RoleKey,
} from "@prisma/client";

import { AuthActor } from "../common/types/auth-actor.type";
import { NotificationsService } from "../notifications/notifications.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MailboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async listConversations(actor: AuthActor) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: actor.userId,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            memberProfile: {
              select: {
                id: true,
                displayId: true,
                displayName: true,
                firstName: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            sentAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            body: true,
            sentAt: true,
            senderUserId: true,
          },
        },
      },
    });

    return conversations.map((conversation) => {
      const currentParticipant = conversation.participants.find(
        (participant) => participant.userId === actor.userId,
      );
      const counterpart = conversation.participants.find(
        (participant) => participant.userId !== actor.userId,
      );

      return {
        id: conversation.id,
        type: conversation.type,
        updatedAt: conversation.updatedAt,
        counterpart: counterpart
          ? {
              userId: counterpart.userId,
              email: counterpart.user.email,
              memberProfile: counterpart.memberProfile,
            }
          : null,
        lastMessage: conversation.messages[0] ?? null,
        lastReadMessageId: currentParticipant?.lastReadMessageId ?? null,
      };
    });
  }

  async getConversationMessages(actor: AuthActor, conversationId: string) {
    let conversation;
    try {
      conversation = await this.requireConversationParticipant(
        actor.userId,
        conversationId,
      );
    } catch {
      // Gracefully handle missing or inaccessible conversations (e.g. legacy data)
      return { conversation: { id: conversationId, type: "DIRECT" }, messages: [] };
    }

    const messages = await this.prisma.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
      },
      orderBy: {
        sentAt: "asc",
      },
      select: {
        id: true,
        messageType: true,
        body: true,
        attachmentPath: true,
        sentAt: true,
        deliveredAt: true,
        readAt: true,
        senderUserId: true,
        senderUser: {
          select: {
            id: true,
            email: true,
          },
        },
        senderMemberProfile: {
          select: {
            id: true,
            displayId: true,
            displayName: true,
            firstName: true,
          },
        },
      },
    });

    return {
      conversation: {
        id: conversation.id,
        type: conversation.type,
      },
      messages,
    };
  }

  async createDirectConversation(actor: AuthActor, targetMemberProfileId: string) {
    this.requireMemberActor(actor);

    const actorProfileId = actor.memberProfileId!;
    const targetProfile = await this.prisma.memberProfile.findUnique({
      where: { id: targetMemberProfileId },
      select: {
        id: true,
        userId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!targetProfile) {
      throw new NotFoundException("Target member profile was not found.");
    }

    if (targetProfile.id === actorProfileId) {
      throw new BadRequestException("You cannot create a conversation with yourself.");
    }

    await this.ensureNotBlocked(actorProfileId, targetProfile.id);

    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        type: ConversationType.MEMBER_TO_MEMBER,
        participants: {
          some: {
            userId: actor.userId,
          },
        },
        AND: {
          participants: {
            some: {
              userId: targetProfile.userId,
            },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            memberProfile: {
              select: {
                id: true,
                displayId: true,
                displayName: true,
                firstName: true,
              },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return existingConversation;
    }

    return this.prisma.conversation.create({
      data: {
        type: ConversationType.MEMBER_TO_MEMBER,
        participants: {
          create: [
            {
              userId: actor.userId,
              memberProfileId: actorProfileId,
            },
            {
              userId: targetProfile.userId,
              memberProfileId: targetProfile.id,
            },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            memberProfile: {
              select: {
                id: true,
                displayId: true,
                displayName: true,
                firstName: true,
              },
            },
          },
        },
      },
    });
  }

  async sendMessage(actor: AuthActor, conversationId: string, body: string) {
    const conversation = await this.requireConversationParticipant(
      actor.userId,
      conversationId,
    );

    if (conversation.type === ConversationType.MEMBER_TO_MEMBER) {
      this.requireMemberActor(actor);
      await this.ensureActiveMessagingMembership(actor.userId);

      const recipient = conversation.participants.find(
        (participant) => participant.userId !== actor.userId,
      );

      if (!recipient?.memberProfileId) {
        throw new ForbiddenException("Direct member messaging is not configured correctly.");
      }

      await this.ensureNotBlocked(actor.memberProfileId!, recipient.memberProfileId);
    }

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      throw new BadRequestException("Message body cannot be empty.");
    }

    const recipient = conversation.participants.find(
      (participant) => participant.userId !== actor.userId,
    );

    const message = await this.prisma.$transaction(async (tx) => {
      const createdMessage = await tx.message.create({
        data: {
          conversationId,
          senderUserId: actor.userId,
          senderMemberProfileId: actor.memberProfileId ?? undefined,
          messageType: MessageType.TEXT,
          body: trimmedBody,
        },
      });

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          updatedAt: createdMessage.sentAt,
        },
      });

      if (recipient?.user.email) {
        await (tx as any).notificationOutbox.create({
          data: {
            userId: recipient.userId,
            recipientEmail: recipient.user.email,
            templateKey: "NEW_MAILBOX_MESSAGE",
            subject: "You have a new Borbodhu message",
            bodyJson: {
              conversationId,
              senderEmail: actor.email,
              preview: trimmedBody.slice(0, 120),
            },
            metadataJson: {
              messageId: createdMessage.id,
              type: conversation.type,
            },
          },
        });
      }

      return createdMessage;
    });

    return {
      success: true,
      message,
    };
  }

  async markConversationRead(actor: AuthActor, conversationId: string) {
    const conversation = await this.requireConversationParticipant(
      actor.userId,
      conversationId,
    );
    const latestMessage = await this.prisma.message.findFirst({
      where: {
        conversationId,
      },
      orderBy: {
        sentAt: "desc",
      },
      select: {
        id: true,
      },
    });

    const participant = conversation.participants.find(
      (entry) => entry.userId === actor.userId,
    );

    if (!participant) {
      throw new NotFoundException("Conversation participant was not found.");
    }

    await this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: actor.userId,
        },
      },
      data: {
        lastReadMessageId: latestMessage?.id ?? null,
      },
    });

    return {
      success: true,
      lastReadMessageId: latestMessage?.id ?? null,
    };
  }

  private requireMemberActor(actor: AuthActor) {
    if (!actor.roles.includes(RoleKey.MEMBER) || !actor.memberProfileId) {
      throw new ForbiddenException("A member account is required for this action.");
    }
  }

  private async ensureActiveMessagingMembership(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        OR: [
          { endsAt: null },
          { endsAt: { gt: new Date() } },
        ],
        membershipPlan: {
          messageEnabled: true,
        },
      },
      orderBy: {
        endsAt: "desc",
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: "UPGRADE_REQUIRED",
        message:
          "Paid membership is required to send messages. Please upgrade to continue.",
      });
    }
  }

  private async ensureNotBlocked(
    actorMemberProfileId: string,
    targetMemberProfileId: string,
  ) {
    const block = await this.prisma.interaction.findFirst({
      where: {
        interactionType: InteractionType.BLOCK,
        status: InteractionStatus.ACTIVE,
        OR: [
          {
            actorMemberProfileId,
            targetMemberProfileId,
          },
          {
            actorMemberProfileId: targetMemberProfileId,
            targetMemberProfileId: actorMemberProfileId,
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (block) {
      throw new ForbiddenException(
        "Messaging is not available because one of these profiles is blocked.",
      );
    }
  }

  private async requireConversationParticipant(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: {
            userId,
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException("Conversation was not found.");
    }

    return conversation;
  }
}
