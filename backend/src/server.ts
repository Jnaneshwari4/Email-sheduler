import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { redisConnection } from "./config/redis";
import { emailDispatchQueue } from "./queues/email-dispatch.queue";

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info("Backend server started", {
    port: PORT,
    nodeEnv: env.NODE_ENV
  });
});

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info("Received shutdown signal", { signal });

  server.close(async () => {
    try {
      await emailDispatchQueue.close();
      await redisConnection.quit();
      logger.info("Shutdown completed successfully");
      process.exit(0);
    } catch (error) {
      logger.error("Shutdown completed with errors", {
        error: error instanceof Error ? error.message : "Unknown error"
      });
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
