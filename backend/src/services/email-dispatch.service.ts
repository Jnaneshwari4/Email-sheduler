import { logger } from "../config/logger";
import { type EmailDispatchJobData } from "../queues/email-dispatch.queue";
import { SenderRepository } from "../repositories/sender.repository";
import { MailerService } from "./mailer.service";

const mailerService = new MailerService(new SenderRepository());

export class EmailDispatchService {
  async dispatch(job: EmailDispatchJobData): Promise<void> {
    const result = await mailerService.sendEmail({
      senderId: job.senderId,
      recipient: job.recipient,
      subject: job.subject,
      body: job.body
    });

  logger.info("Email sent successfully", {
  emailJobId: job.emailJobId,
  recipient: job.recipient,
  messageId: result.messageId
});
  }
}
