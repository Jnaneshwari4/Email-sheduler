import dotenv from "dotenv";
import { emailDispatchQueue } from "../src/queues/email-dispatch.queue";

dotenv.config({ override: true });

async function main() {
  try {
    const counts = await emailDispatchQueue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed"
    );

    console.log(
      "Redis/BullMQ queue health:",
      JSON.stringify(counts, null, 2)
    );

    const jobs = await emailDispatchQueue.getJobs(
      ["waiting", "active", "delayed", "completed", "failed"],
      0,
      100,
      true
    );

    console.log("\nJobs:");

    for (const job of jobs) {
      console.log({
        id: job.id,
        name: job.name,
        emailJobId: job.data?.emailJobId,
        recipient: job.data?.recipient,
        scheduledAt: job.data?.scheduledAtIso,
        state: await job.getState(),
        timestamp: new Date(job.timestamp).toISOString(),
        delay: job.opts.delay
      });
    }
  } catch (error) {
    console.error(
      "Queue health check failed:",
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  } finally {
    await emailDispatchQueue.close();
  }
}

main();