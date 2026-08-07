import { env } from "../config/env";
import { SenderRepository } from "../repositories/sender.repository";

const senderRepository = new SenderRepository();
const placeholderSenderEmail = "replace-with-ethereal-user";

export async function ensureDefaultSender(): Promise<void> {
  const existing = await senderRepository.findByEmail(env.SMTP_USER);
  const placeholderSender = await senderRepository.findByEmail(placeholderSenderEmail);

  if (placeholderSender) {
    if (existing) {
      // Reassign any email jobs from the placeholder sender to the real Ethereal sender,
      // then remove the placeholder record so only the real sender remains.
      await senderRepository.reassignJobs(placeholderSender.id, existing.id);
      await senderRepository.deleteById(placeholderSender.id);
      return;
    }

    await senderRepository.updateById(placeholderSender.id, {
      email: env.SMTP_USER,
      smtpHost: env.SMTP_HOST,
      smtpPort: env.SMTP_PORT,
      smtpUser: env.SMTP_USER,
      smtpPassEnc: env.SMTP_PASS
    });

    return;
  }

  if (existing) {
    return;
  }

  await senderRepository.create({
    email: env.SMTP_USER,
    smtpHost: env.SMTP_HOST,
    smtpPort: env.SMTP_PORT,
    smtpUser: env.SMTP_USER,
    smtpPassEnc: env.SMTP_PASS
  });
}
