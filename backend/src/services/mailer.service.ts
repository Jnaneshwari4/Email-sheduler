import { Resend } from "resend";
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
  previewUrl?: string;
};

export class MailerService {
  private readonly resend: Resend;

  constructor(private readonly senderRepository: SenderRepository) {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const sender = await this.senderRepository.findById(input.senderId);

    if (!sender) {
      throw new AppError("Sender not found", 404);
    }

    const { data, error } = await this.resend.emails.send({
      from: "Email Scheduler <onboarding@resend.dev>",
      to: [input.recipient],
      subject: input.subject,
      text: input.body,
      html: `<pre style="font-family:inherit">${this.escapeHtml(input.body)}</pre>`
    });

    if (error) {
      throw new AppError(`Email sending failed: ${error.message}`, 502);
    }

    if (!data?.id) {
      throw new AppError("Email provider did not return a message ID", 502);
    }

    return {
      messageId: data.id
    };
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}