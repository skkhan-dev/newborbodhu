import { Injectable } from "@nestjs/common";
import { Prisma, PrismaClient } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

type QueueEmailInput = {
  userId?: string | null;
  recipientEmail: string;
  templateKey: string;
  subject: string;
  bodyJson: Record<string, unknown>;
  metadataJson?: Record<string, unknown>;
  scheduledAt?: Date;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  private isRealEmail(email: string): boolean {
    return !email.endsWith("@managed.borbodhu.local");
  }

  queueEmail(input: QueueEmailInput) {
    if (!this.isRealEmail(input.recipientEmail)) return Promise.resolve(null as any);
    const prisma = this.prisma as PrismaClient;

    return prisma.notificationOutbox.create({
      data: {
        userId: input.userId ?? undefined,
        recipientEmail: input.recipientEmail.trim().toLowerCase(),
        channel: "EMAIL",
        templateKey: input.templateKey,
        subject: input.subject,
        bodyJson: input.bodyJson as Prisma.InputJsonValue,
        metadataJson: input.metadataJson as Prisma.InputJsonValue | undefined,
        status: "PENDING",
        scheduledAt: input.scheduledAt,
      },
    });
  }

  queueEmails(inputs: QueueEmailInput[]) {
    const prisma = this.prisma as PrismaClient;

    const realInputs = inputs.filter((i) => this.isRealEmail(i.recipientEmail));
    if (!realInputs.length) {
      return Promise.resolve({ count: 0 });
    }

    return prisma.notificationOutbox.createMany({
      data: realInputs.map((input) => ({
        userId: input.userId ?? undefined,
        recipientEmail: input.recipientEmail.trim().toLowerCase(),
        channel: "EMAIL",
        templateKey: input.templateKey,
        subject: input.subject,
        bodyJson: input.bodyJson as Prisma.InputJsonValue,
        metadataJson: input.metadataJson as Prisma.InputJsonValue | undefined,
        status: "PENDING",
        scheduledAt: input.scheduledAt,
      })),
    });
  }
}
