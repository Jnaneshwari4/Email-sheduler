import dotenv from "dotenv";
import { emailDispatchQueue } from "../src/queues/email-dispatch.queue";

dotenv.config({ override: true });

async function main() {
  try {
    const counts = await emailDispatchQueue.getJobCounts("waiting", "active", "completed", "failed", "delayed");
    console.log("Redis/BullMQ queue health:", JSON.stringify(counts, null, 2));
  } catch (error) {
    console.error("Queue health check failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await emailDispatchQueue.close();
  }
}

main();
