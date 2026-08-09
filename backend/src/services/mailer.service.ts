import { BrevoClient } from "@getbrevo/brevo";
import { env } from "../config/env";
import { SenderRepository } from "../repositories/sender.repository";
import { AppError } from "../utils/app-error";

type SendEmailInput = {
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
};

type SendEmailResult = {
  messageId: string;
};

export class MailerService {
  private readonly brevo: BrevoClient;

  constructor(private readonly senderRepository: SenderRepository) {
    this.brevo = new BrevoClient({
      apiKey: env.BREVO_API_KEY
    });
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const sender = await this.senderRepository.findById(input.senderId);

    if (!sender) {
      throw new AppError("Sender not found", 404);
    }

    try {
      const result = await this.brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: env.BREVO_SENDER_NAME,
          email: env.BREVO_SENDER_EMAIL
        },
        to: [
          {
            email: input.recipient
          }
        ],
        subject: input.subject,
        textContent: input.body,
        htmlContent: `<pre style="font-family:inherit">${this.escapeHtml(
          input.body
        )}</pre>`
      });

      if (!result?.messageId) {
        throw new AppError(
          "Email provider did not return a message ID",
          502
        );
      }

      return {
        messageId: result.messageId
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const message =
        error instanceof Error ? error.message : "Unknown email provider error";

      throw new AppError(`Email sending failed: ${message}`, 502);
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}