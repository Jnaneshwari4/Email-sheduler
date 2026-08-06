import { Worker, type Job } from "bullmq";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { createRedisConnection } from "../config/redis";
import {
  buildRescheduledEmailDispatchJobId,
  enqueueEmailDispatchJob,
  type EmailDispatchJobData
} from "../queues/email-dispatch.queue";
import { JOB_NAMES, QUEUE_NAMES } from "../queues/queue-names";
import { EmailJobRepository } from "../repositories/email-job.repository";
import { EmailDispatchService } from "../services/email-dispatch.service";
import { RateLimitService } from "../services/rate-limit.service";

const workerConnection = createRedisConnection();
const emailJobRepository = new EmailJobRepository();
const emailDispatchService = new EmailDispatchService();
const rateLimitService = new RateLimitService();

type WorkerResult =
  | {
      outcome: "ignored";
    }
  | {
      outcome: "sent";
    }
  | {
      outcome: "rescheduled";
      rescheduledForIso: string;
      sequence: number;
    };

const emailDispatchWorker = new Worker<EmailDispatchJobData>(
  QUEUE_NAMES.EMAIL_DISPATCH,
  async (job: Job<EmailDispatchJobData>): Promise<WorkerResult> => {
    if (job.name !== JOB_NAMES.SEND_SCHEDULED_EMAIL) {
      logger.warn("Skipping unknown job name", { jobName: job.name, jobId: job.id });
      return {
        outcome: "ignored"
      };
    }

    await emailJobRepository.markProcessing(job.data.emailJobId);

    const limitDecision = await rateLimitService.reserveSlotOrGetReschedule();

    if (!limitDecision.allowed) {
      const rescheduledFor = limitDecision.rescheduleAt;
      await emailJobRepository.markScheduled(job.data.emailJobId, rescheduledFor);

      await enqueueEmailDispatchJob({
        data: {
          ...job.data,
          scheduledAtIso: rescheduledFor.toISOString()
        },
        delayMs: rescheduledFor.getTime() - Date.now(),
        customJobId: buildRescheduledEmailDispatchJobId(
          job.data.emailJobId,
          rescheduledFor.getTime(),
          limitDecision.sequence
        )
      });

      return {
        outcome: "rescheduled",
        rescheduledForIso: rescheduledFor.toISOString(),
        sequence: limitDecision.sequence
      };
    }

    await emailDispatchService.dispatch(job.data);

    return {
      outcome: "sent"
    };
  },
  {
    connection: workerConnection,
    concurrency: env.WORKER_CONCURRENCY
  }
);

emailDispatchWorker.on("active", (job) => {
  logger.info("Worker started processing job", {
    queue: QUEUE_NAMES.EMAIL_DISPATCH,
    jobId: job.id,
    emailJobId: job.data.emailJobId,
    attempt: job.attemptsMade + 1
  });
});

emailDispatchWorker.on("completed", async (job, result: WorkerResult) => {
  if (result.outcome === "ignored") {
    return;
  }

  if (result.outcome === "rescheduled") {
    logger.info("Job deferred due to hourly limit", {
      queue: QUEUE_NAMES.EMAIL_DISPATCH,
      jobId: job.id,
      emailJobId: job.data.emailJobId,
      rescheduledFor: result.rescheduledForIso,
      sequence: result.sequence
    });
    return;
  }

  try {
    await emailJobRepository.markSent(job.data.emailJobId);

    logger.info("Worker completed job", {
      queue: QUEUE_NAMES.EMAIL_DISPATCH,
      jobId: job.id,
      emailJobId: job.data.emailJobId
    });
  } catch (error) {
    logger.error("Failed to mark job as sent", {
      emailJobId: job.data.emailJobId,
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

emailDispatchWorker.on("failed", async (job, error) => {
  const emailJobId = job?.data.emailJobId;

  logger.error("Worker job failed", {
    queue: QUEUE_NAMES.EMAIL_DISPATCH,
    jobId: job?.id,
    emailJobId,
    attemptsMade: job?.attemptsMade,
    attemptsAllowed: job?.opts.attempts,
    error: error.message
  });

  if (!job || !emailJobId) {
    return;
  }

  const attemptsAllowed = typeof job.opts.attempts === "number" ? job.opts.attempts : 1;

  if (job.attemptsMade >= attemptsAllowed) {
    try {
      await emailJobRepository.markFailed(emailJobId);
    } catch (markError) {
      logger.error("Failed to mark job as failed", {
        emailJobId,
        error: markError instanceof Error ? markError.message : "Unknown error"
      });
    }
  }
});

emailDispatchWorker.on("error", (error) => {
  logger.error("Worker runtime error", {
    error: error.message
  });
});

logger.info("Email dispatch worker started", {
  queue: QUEUE_NAMES.EMAIL_DISPATCH,
  concurrency: env.WORKER_CONCURRENCY
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info("Worker shutdown initiated", { signal });

  try {
    await emailDispatchWorker.close();
    await workerConnection.quit();
    await prisma.$disconnect();
    logger.info("Worker shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("Worker shutdown failed", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    process.exit(1);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
