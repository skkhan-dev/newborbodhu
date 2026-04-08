import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";
import { PrismaClient } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class EmailDispatcherService {
  private readonly logger = new Logger(EmailDispatcherService.name);
  private readonly resend: Resend | null;
  private readonly fromAddress: string;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress =
      process.env.RESEND_FROM_ADDRESS ?? "Borbodhu <noreply@borbodhu.com>";

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log("Resend email dispatcher initialized.");
    } else {
      this.resend = null;
      this.logger.warn(
        "RESEND_API_KEY not set — emails will be queued but not sent.",
      );
    }
  }

  /**
   * Process pending emails from the NotificationOutbox.
   * Call this from a cron job or after queueing notifications.
   */
  async processPendingEmails(batchSize = 20): Promise<number> {
    const db = this.prisma as PrismaClient;

    const pending = await db.notificationOutbox.findMany({
      where: {
        channel: "EMAIL",
        status: "PENDING",
        scheduledAt: { lte: new Date() },
      },
      orderBy: { createdAt: "asc" },
      take: batchSize,
    });

    if (!pending.length) return 0;

    let sent = 0;

    for (const item of pending) {
      try {
        const body = item.bodyJson as Record<string, unknown> | null;
        const htmlBody = this.renderTemplate(
          item.templateKey,
          item.subject,
          body,
        );

        if (this.resend) {
          await this.resend.emails.send({
            from: this.fromAddress,
            to: item.recipientEmail,
            subject: item.subject,
            html: htmlBody,
          });
        } else {
          this.logger.debug(
            `[DRY RUN] Would send "${item.subject}" to ${item.recipientEmail}`,
          );
        }

        await db.notificationOutbox.update({
          where: { id: item.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            attempts: { increment: 1 },
          },
        });
        sent++;
      } catch (error) {
        this.logger.error(
          `Failed to send email ${item.id}: ${error instanceof Error ? error.message : String(error)}`,
        );

        await db.notificationOutbox.update({
          where: { id: item.id },
          data: {
            status: (item.attempts ?? 0) >= 2 ? "FAILED" : "PENDING",
            attempts: { increment: 1 },
            metadataJson: {
              lastError: error instanceof Error ? error.message : String(error),
            },
          },
        });
      }
    }

    this.logger.log(`Processed ${sent}/${pending.length} emails.`);
    return sent;
  }

  /**
   * Render a simple HTML email from a template key + body data.
   */
  private renderTemplate(
    templateKey: string,
    subject: string,
    body: Record<string, unknown> | null,
  ): string {
    const name = body?.name ?? body?.recipientName ?? "";
    let content: unknown = body?.content ?? body?.message ?? body?.body ?? "";

    // Template-specific content
    let codeBlock = "";
    switch (templateKey) {
      case "welcome":
        content = `
          <p>আস্সালামু আলাইকুম — Welcome to Borbodhu!</p>
          <p>Your account has been created successfully. Complete your profile to start discovering verified matches and connect with Bangladeshi families across the world.</p>
          <p>Our team reviews every profile before it goes live, so your privacy and safety are always protected.</p>
        `;
        break;
      case "email_verification": {
        const code = String(body?.code ?? "");
        codeBlock = code
          ? `<div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;background:#faf5ee;border:2px solid #8b1a30;border-radius:12px;padding:16px 32px;">
                <p style="margin:0 0 4px;font-size:12px;color:#8b1a30;font-weight:600;letter-spacing:1px;text-transform:uppercase;">Verification Code</p>
                <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#1a1522;font-family:monospace;">${code}</p>
              </div>
              <p style="font-size:12px;color:#5c5264;margin:8px 0 0;">This code expires in 30 minutes.</p>
            </div>`
          : "";
        content = `
          <p>Please verify your email address to activate your Borbodhu account.</p>
          <p>Enter the 6-digit code below in the app:</p>
        `;
        break;
      }
      case "password_reset": {
        const resetUrl = String(body?.resetUrl ?? "");
        content = `
          <p>We received a request to reset your Borbodhu password.</p>
          <p>Click the button below to create a new password. This link expires in 1 hour.</p>
          <p>If you didn't request a password reset, you can safely ignore this email.</p>
        `;
        if (resetUrl) {
          codeBlock = `<div style="margin:24px 0;text-align:center;">
            <a href="${resetUrl}" style="background:linear-gradient(135deg,#8b1a30,#a63248);color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
              Reset Password
            </a>
          </div>`;
        }
        break;
      }
      case "interest_received":
        content = `You have received a new interest from ${String(body?.senderName ?? "a member")}. Log in to view their profile and respond.`;
        break;
      case "photo_request":
        content = `Someone has requested to view your private photos. Log in to review and respond to the request.`;
        break;
      case "profile_approved":
        content = "Great news! Your profile has been reviewed and approved by our team. It is now visible to other members on Borbodhu.";
        break;
    }
    const ctaUrl = body?.ctaUrl ?? body?.actionUrl ?? "";
    const ctaLabel = body?.ctaLabel ?? body?.actionLabel ?? "Visit Borbodhu";

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#f5ede0;color:#1a1522;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <!-- Header -->
  <div style="background:linear-gradient(135deg,#8b1a30,#6b1224);border-radius:16px 16px 0 0;padding:24px;text-align:center;">
    <p style="margin:0 0 2px;font-size:11px;color:rgba(255,255,255,0.7);letter-spacing:2px;text-transform:uppercase;">মনের মানুষের</p>
    <p style="margin:0;font-size:22px;font-weight:700;color:#fff;letter-spacing:0.5px;">borbodhu.com</p>
    <p style="margin:2px 0 0;font-size:11px;color:rgba(255,255,255,0.7);">আধুনিক ঠিকানা</p>
  </div>
  <!-- Body -->
  <div style="background:#fff;padding:32px 28px;">
    ${name ? `<p style="font-size:15px;margin:0 0 16px;">Hi <strong>${String(name)}</strong>,</p>` : ""}
    <h2 style="font-family:Georgia,serif;color:#1a1522;font-size:20px;margin:0 0 16px;">${subject}</h2>
    <div style="font-size:15px;line-height:1.7;color:#3d3547;">
      ${String(content)}
    </div>
    ${codeBlock}
    ${
      ctaUrl
        ? `<div style="margin:24px 0;text-align:center;">
        <a href="${String(ctaUrl)}" style="background:linear-gradient(135deg,#8b1a30,#a63248);color:#fff;padding:12px 28px;border-radius:999px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block;">
          ${String(ctaLabel)}
        </a>
      </div>`
        : ""
    }
  </div>
  <!-- Footer -->
  <div style="background:#f5ede0;border-radius:0 0 16px 16px;padding:20px 28px;text-align:center;">
    <p style="font-size:12px;color:#5c5264;margin:0 0 4px;">
      borbodhu.com — Trusted Bangladeshi Matrimony
    </p>
    <p style="font-size:12px;margin:0;">
      <a href="https://borbodhu.com" style="color:#8b1a30;text-decoration:none;">borbodhu.com</a>
    </p>
  </div>
</div>
</body>
</html>`.trim();
  }
}
