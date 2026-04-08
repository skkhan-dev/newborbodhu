import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

import { EmailDispatcherService } from "./email-dispatcher.service";

@Injectable()
export class EmailCronService {
  private readonly logger = new Logger(EmailCronService.name);
  private isProcessing = false;

  constructor(private readonly dispatcher: EmailDispatcherService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEmailCron() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    try {
      const sent = await this.dispatcher.processPendingEmails(20);
      if (sent > 0) {
        this.logger.log(`Dispatched ${sent} pending emails`);
      }
    } catch (error) {
      this.logger.error(`Email cron error: ${error}`);
    } finally {
      this.isProcessing = false;
    }
  }
}
