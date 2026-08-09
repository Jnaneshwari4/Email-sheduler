import { Worker, type Job } from "bullmq";
import { env } from "../config/env";
import { logger } from "../config/logger";
import { prisma } from "../config/prisma";
import { createRedisConnection } from "../config/redis";

import {
  buildEmailDispatchJobId,
  buildRescheduledEmailDispatchJobId,
  enqueueEmailDispatchJob,
  emailDispatchQueue,
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

/**
 * Recover scheduled emails when the worker starts.
 *
 * This handles the situation where:
 *
 * 1. Backend and worker are stopped.
 * 2. An email's scheduled time passes.
 * 3. Worker is started again later.
 *
 * Any SCHEDULED database record that does not currently
 * have a usable BullMQ job is re-enqueued.
 */
async function recoverScheduledEmailJobs(): Promise<void> {
  logger.info("Starting scheduled email recovery");

  const scheduledEmails =
    await emailJobRepository.findAllScheduled();

  if (scheduledEmails.length === 0) {
    logger.info("No scheduled emails found during recovery");
    return;
  }

  /*
   * Find jobs that are currently available for processing.
   *
   * We don't include completed or failed jobs here because
   * those jobs are no longer available for processing.
   */
  const existingQueueJobs = await emailDispatchQueue.getJobs(
    ["waiting", "delayed", "active", "prioritized"],
    0,
    -1
  );

  const queuedEmailJobIds = new Set(
    existingQueueJobs
      .map((job) => job.data?.emailJobId)
      .filter(
        (emailJobId): emailJobId is string =>
          typeof emailJobId === "string"
      )
  );

  let recoveredCount = 0;

  for (const emailJob of scheduledEmails) {
    /*
     * If there is already a usable BullMQ job for this
     * database record, don't create a duplicate.
     */
    if (queuedEmailJobIds.has(emailJob.id)) {
      continue;
    }

    const jobId = buildEmailDispatchJobId(emailJob.id);

    /*
     * A previous completed/failed job may still exist because
     * removeOnComplete and removeOnFail are false.
     *
     * BullMQ will not allow us to add another job with the
     * same job ID, so remove the old completed/failed job first.
     */
    const existingJob =
      await emailDispatchQueue.getJob(jobId);

    if (existingJob) {
      const state = await existingJob.getState();

      if (state === "completed" || state === "failed") {
        await existingJob.remove();

        logger.info(
          "Removed old BullMQ job before recovery",
          {
            emailJobId: emailJob.id,
            jobId,
            state
          }
        );
      } else {
        /*
         * The job exists in another usable/transitioning state.
         * Don't create a duplicate.
         */
        continue;
      }
    }

    /*
     * If scheduledAt is in the future, BullMQ waits until that time.
     *
     * If scheduledAt is already in the past, delayMs becomes 0
     * and the email is processed immediately.
     */
    const delayMs = Math.max(
      0,
      emailJob.scheduledAt.getTime() - Date.now()
    );

    await enqueueEmailDispatchJob({
      data: {
        emailJobId: emailJob.id,
        userId: emailJob.userId,
        senderId: emailJob.senderId,
        recipient: emailJob.recipient,
        subject: emailJob.subject,
        body: emailJob.body,
        scheduledAtIso: emailJob.scheduledAt.toISOString()
      },
      delayMs,
      customJobId: jobId
    });

    recoveredCount++;

    logger.info("Recovered scheduled email job", {
      emailJobId: emailJob.id,
      recipient: emailJob.recipient,
      scheduledAt: emailJob.scheduledAt.toISOString(),
      delayMs
    });
  }

  logger.info("Scheduled email recovery completed", {
    scheduledCount: scheduledEmails.length,
    recoveredCount
  });
}

/**
 * BullMQ worker
 */
const emailDispatchWorker = new Worker<
  EmailDispatchJobData,
  WorkerResult
>(
  QUEUE_NAMES.EMAIL_DISPATCH,

  async (
    job: Job<EmailDispatchJobData>
  ): Promise<WorkerResult> => {
    if (job.name !== JOB_NAMES.SEND_SCHEDULED_EMAIL) {
      logger.warn("Skipping unknown job name", {
        jobName: job.name,
        jobId: job.id
      });

      return {
        outcome: "ignored"
      };
    }

    /*
     * Check the database record BEFORE changing its status.
     *
     * This prevents an orphaned BullMQ job from failing repeatedly
     * when its corresponding database record has been deleted.
     */
    const emailJob = await emailJobRepository.findById(
      job.data.emailJobId
    );

    if (!emailJob) {
      logger.warn(
        "Skipping queued job because email record no longer exists",
        {
          emailJobId: job.data.emailJobId,
          jobId: job.id
        }
      );

      return {
        outcome: "ignored"
      };
    }

    await emailJobRepository.markProcessing(
      job.data.emailJobId
    );

    /*
     * Apply hourly rate limiting.
     *
     * If the limit has been reached, put the email back into
     * SCHEDULED state and create a new delayed BullMQ job.
     */
    const limitDecision =
      await rateLimitService.reserveSlotOrGetReschedule();

    if (!limitDecision.allowed) {
      const rescheduledFor = limitDecision.rescheduleAt;

      await emailJobRepository.markScheduled(
        job.data.emailJobId,
        rescheduledFor
      );

      await enqueueEmailDispatchJob({
        data: {
          ...job.data,
          scheduledAtIso: rescheduledFor.toISOString()
        },
        delayMs: Math.max(
          0,
          rescheduledFor.getTime() - Date.now()
        ),
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

    /*
     * Send the email.
     */
    await emailDispatchService.dispatch({
      ...job.data,
      senderId: emailJob.senderId
    });

    return {
      outcome: "sent"
    };
  },

  {
    connection: workerConnection,
    concurrency: env.WORKER_CONCURRENCY
  }
);

/**
 * Worker active event
 */
emailDispatchWorker.on("active", (job) => {
  logger.info("Worker started processing job", {
    queue: QUEUE_NAMES.EMAIL_DISPATCH,
    jobId: job.id,
    emailJobId: job.data.emailJobId,
    attempt: job.attemptsMade + 1
  });
});

/**
 * Worker completed event
 */
emailDispatchWorker.on(
  "completed",
  async (job, result: WorkerResult) => {
    if (result.outcome === "ignored") {
      return;
    }

    /*
     * A rate-limited job has been put back into the queue.
     * Don't mark it as SENT.
     */
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

    /*
     * Email was successfully sent.
     * Update PostgreSQL status to SENT.
     */
    try {
      await emailJobRepository.markSent(
        job.data.emailJobId
      );

      logger.info("Worker completed job", {
        queue: QUEUE_NAMES.EMAIL_DISPATCH,
        jobId: job.id,
        emailJobId: job.data.emailJobId
      });
    } catch (error) {
      logger.error("Failed to mark job as sent", {
        emailJobId: job.data.emailJobId,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error"
      });
    }
  }
);

/**
 * Worker failed event
 */
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

  const attemptsAllowed =
    typeof job.opts.attempts === "number"
      ? job.opts.attempts
      : 1;

  /*
   * Only mark the database record FAILED after all retries
   * have been exhausted.
   */
  if (job.attemptsMade >= attemptsAllowed) {
    try {
      await emailJobRepository.markFailed(emailJobId);
    } catch (markError) {
      logger.error("Failed to mark job as failed", {
        emailJobId,
        error:
          markError instanceof Error
            ? markError.message
            : "Unknown error"
      });
    }
  }
});

/**
 * Worker runtime error
 */
emailDispatchWorker.on("error", (error) => {
  logger.error("Worker runtime error", {
    error: error.message
  });
});

logger.info("Email dispatch worker started", {
  queue: QUEUE_NAMES.EMAIL_DISPATCH,
  concurrency: env.WORKER_CONCURRENCY
});

/**
 * Start recovery after the worker has been created.
 *
 * This is what allows overdue SCHEDULED emails to be recovered
 * after the backend/worker were stopped.
 */
void recoverScheduledEmailJobs().catch((error) => {
  logger.error("Scheduled email recovery failed", {
    error:
      error instanceof Error
        ? error.message
        : "Unknown error"
  });
});

/**
 * Graceful shutdown
 */
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  logger.info("Worker shutdown initiated", {
    signal
  });

  try {
    await emailDispatchWorker.close();
    await workerConnection.quit();
    await emailDispatchQueue.close();
    await prisma.$disconnect();

    logger.info("Worker shutdown completed");

    process.exit(0);
  } catch (error) {
    logger.error("Worker shutdown failed", {
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
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