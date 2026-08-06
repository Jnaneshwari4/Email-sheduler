import { type Request, type Response } from "express";
import { emailDispatchQueue } from "../queues/email-dispatch.queue";

export async function getQueueHealth(_req: Request, res: Response): Promise<void> {
  const [waiting, delayed, active, completed, failed] = await Promise.all([
    emailDispatchQueue.getWaitingCount(),
    emailDispatchQueue.getDelayedCount(),
    emailDispatchQueue.getActiveCount(),
    emailDispatchQueue.getCompletedCount(),
    emailDispatchQueue.getFailedCount()
  ]);

  res.status(200).json({
    success: true,
    data: {
      queue: "email-dispatch",
      counts: {
        waiting,
        delayed,
        active,
        completed,
        failed
      }
    }
  });
}
