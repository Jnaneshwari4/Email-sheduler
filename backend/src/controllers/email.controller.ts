import { type Request, type Response } from "express";
import { EmailJobStatus } from "@prisma/client";
import { AppError } from "../utils/app-error";
import { EmailJobRepository } from "../repositories/email-job.repository";
import { SenderRepository } from "../repositories/sender.repository";
import { EmailQueueService } from "../services/email-queue.service";
import { scheduleEmailRequestSchema } from "../validators/email.validator";

const emailJobRepository = new EmailJobRepository();
const senderRepository = new SenderRepository();
const emailQueueService = new EmailQueueService();

export async function scheduleEmails(req: Request, res: Response): Promise<void> {
  const parsed = scheduleEmailRequestSchema.parse({
    body: req.body
  });

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const userId = req.user.id;
  const sender = await senderRepository.findById(parsed.body.senderId);

  if (!sender) {
    throw new AppError("Sender not found", 404);
  }

  const startTime = new Date(parsed.body.startTime);

  if (Number.isNaN(startTime.getTime())) {
    throw new AppError("Invalid start time", 400);
  }

  const uniqueRecipients = Array.from(
    new Set(parsed.body.recipients.map((recipient) => recipient.trim().toLowerCase()))
  );

  if (uniqueRecipients.length === 0) {
    throw new AppError("No valid recipients provided", 400);
  }

  const emailJobs = uniqueRecipients.map((recipient, index) => {
    const scheduledAt = new Date(startTime.getTime() + index * parsed.body.delaySeconds * 1000);

    return {
      id: crypto.randomUUID(),
      userId,
      senderId: parsed.body.senderId,
      recipient,
      subject: parsed.body.subject,
      body: parsed.body.body,
      scheduledAt,
      status: EmailJobStatus.SCHEDULED,
      createdAt: new Date()
    };
  });

  await Promise.all(
    emailJobs.map(async (emailJob) => {
      await emailJobRepository.create(emailJob);
      await emailQueueService.scheduleEmailDispatchJob({
        emailJobId: emailJob.id,
        userId: emailJob.userId,
        senderId: emailJob.senderId,
        recipient: emailJob.recipient,
        subject: emailJob.subject,
        body: emailJob.body,
        scheduledAt: emailJob.scheduledAt
      });
    })
  );

  res.status(201).json({
    success: true,
    data: {
      scheduledCount: emailJobs.length
    }
  });
}

export async function getScheduledEmails(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const emails = await emailJobRepository.findByUserAndStatus(req.user.id, EmailJobStatus.SCHEDULED);

  res.status(200).json({
    success: true,
    data: emails
  });
}

export async function getSentEmails(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const emails = await emailJobRepository.findByUserAndStatus(req.user.id, EmailJobStatus.SENT);

  res.status(200).json({
    success: true,
    data: emails
  });
}

export async function deleteScheduledEmail(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const emailJob = await emailJobRepository.findById(id);

  if (!emailJob || emailJob.userId !== req.user.id) {
    throw new AppError("Scheduled email not found", 404);
  }

  if (emailJob.status !== EmailJobStatus.SCHEDULED) {
    throw new AppError("Only scheduled emails can be deleted", 400);
  }

  await emailQueueService.cancelScheduledEmailDispatchJobs(emailJob.id);
  await emailJobRepository.deleteById(emailJob.id);

  res.status(200).json({
    success: true,
    data: {
      message: "Scheduled email deleted"
    }
  });
}

export async function deleteScheduledEmails(req: Request, res: Response): Promise<void> {
  const { ids } = req.body as { ids: string[] };

  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }

  if (!Array.isArray(ids) || ids.length === 0) {
    throw new AppError("No scheduled email ids provided", 400);
  }

  const scheduledJobs = await Promise.all(ids.map((id) => emailJobRepository.findById(id)));
  const invalidJob = scheduledJobs.find(
    (job) => !job || job.userId !== req.user!.id || job.status !== EmailJobStatus.SCHEDULED
  );

  if (invalidJob) {
    throw new AppError("One or more selected scheduled emails cannot be deleted", 400);
  }

  await Promise.all(
    scheduledJobs.map(async (emailJob) => {
      if (emailJob) {
        await emailQueueService.cancelScheduledEmailDispatchJobs(emailJob.id);
        await emailJobRepository.deleteById(emailJob.id);
      }
    })
  );

  res.status(200).json({
    success: true,
    data: {
      deletedCount: ids.length
    }
  });
}
