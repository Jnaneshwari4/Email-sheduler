import nodemailer, { type Transporter } from "nodemailer";
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
  constructor(private readonly senderRepository: SenderRepository) {}

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const sender = await this.senderRepository.findById(input.senderId);

    if (!sender) {
      throw new AppError("Sender not found", 404);
    }

    const transporter = this.createTransporter(sender);

    const info = await transporter.sendMail({
      from: sender.email,
      to: input.recipient,
      subject: input.subject,
      text: input.body,
      html: `<pre style=\"font-family:inherit\">${this.escapeHtml(input.body)}</pre>`
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    return {
      messageId: info.messageId,
      previewUrl: previewUrl || undefined
    };
  }

  private createTransporter(sender: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassEnc: string;
  }): Transporter {
    const host = sender.smtpHost || env.SMTP_HOST;
    const port = sender.smtpPort || env.SMTP_PORT;
    const user = sender.smtpUser || env.SMTP_USER;
    const pass = sender.smtpPassEnc || env.SMTP_PASS;

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      }
    });
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
}
