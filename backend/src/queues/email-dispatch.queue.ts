import { Queue, type JobsOptions } from "bullmq";
import { redisConnection } from "../config/redis";
import { JOB_NAMES, QUEUE_NAMES } from "./queue-names";

export type EmailDispatchJobData = {
  emailJobId: string;
  userId: string;
  senderId: string;
  recipient: string;
  subject: string;
  body: string;
  scheduledAtIso: string;
};

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000
  },
  removeOnComplete: false,
  removeOnFail: false
};

export const emailDispatchQueue = new Queue<EmailDispatchJobData>(QUEUE_NAMES.EMAIL_DISPATCH, {
  connection: redisConnection,
  defaultJobOptions
});

export function buildEmailDispatchJobId(emailJobId: string): string {
  return `email-dispatch-${emailJobId}`;
}

export function buildRescheduledEmailDispatchJobId(
  emailJobId: string,
  scheduledAtEpochMs: number,
  sequence: number
): string {
  return `email-dispatch-${emailJobId}-${scheduledAtEpochMs}-${sequence}`;
}

export async function enqueueEmailDispatchJob(input: {
  data: EmailDispatchJobData;
  delayMs: number;
  customJobId?: string;
}): Promise<void> {
  await emailDispatchQueue.add(JOB_NAMES.SEND_SCHEDULED_EMAIL, input.data, {
    jobId: input.customJobId ?? buildEmailDispatchJobId(input.data.emailJobId),
    delay: Math.max(0, Math.floor(input.delayMs))
  });
}

export async function removeScheduledEmailDispatchJobs(
  emailJobId: string
): Promise<void> {
  const jobId = buildEmailDispatchJobId(emailJobId);

  const job = await emailDispatchQueue.getJob(jobId);

  if (job) {
    await job.remove();
  }
}
