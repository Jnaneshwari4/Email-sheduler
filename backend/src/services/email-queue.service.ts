import { enqueueEmailDispatchJob } from "../queues/email-dispatch.queue";

export class EmailQueueService {
  async scheduleEmailDispatchJob(input: {
    emailJobId: string;
    userId: string;
    senderId: string;
    recipient: string;
    subject: string;
    body: string;
    scheduledAt: Date;
  }): Promise<void> {
    const delayMs = input.scheduledAt.getTime() - Date.now();

    await enqueueEmailDispatchJob({
      data: {
        emailJobId: input.emailJobId,
        userId: input.userId,
        senderId: input.senderId,
        recipient: input.recipient,
        subject: input.subject,
        body: input.body,
        scheduledAtIso: input.scheduledAt.toISOString()
      },
      delayMs
    });
  }
}
