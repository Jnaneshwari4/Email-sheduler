import { env } from "../config/env";
import { SenderRepository } from "../repositories/sender.repository";

const senderRepository = new SenderRepository();
const placeholderSenderEmail = "replace-with-ethereal-user";

export async function ensureDefaultSender(): Promise<void> {
  const existing = await senderRepository.findByEmail(
    env.BREVO_SENDER_EMAIL
  );

  const placeholderSender = await senderRepository.findByEmail(
    placeholderSenderEmail
  );

  if (placeholderSender) {
    if (existing) {
      await senderRepository.reassignJobs(
        placeholderSender.id,
        existing.id
      );

      await senderRepository.deleteById(placeholderSender.id);
      return;
    }

    await senderRepository.updateById(placeholderSender.id, {
      email: env.BREVO_SENDER_EMAIL,
      smtpHost: "api.brevo.com",
      smtpPort: 443,
      smtpUser: env.BREVO_SENDER_EMAIL,
      smtpPassEnc: env.BREVO_API_KEY
    });

    return;
  }

  if (existing) {
    return;
  }

  await senderRepository.create({
    email: env.BREVO_SENDER_EMAIL,
    smtpHost: "api.brevo.com",
    smtpPort: 443,
    smtpUser: env.BREVO_SENDER_EMAIL,
    smtpPassEnc: env.BREVO_API_KEY
  });
}