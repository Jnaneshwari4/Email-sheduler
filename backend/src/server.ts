import app from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { redisConnection } from "./config/redis";
import { emailDispatchQueue } from "./queues/email-dispatch.queue";
import { ensureDefaultSender } from "./services/sender-initializer.service";

const PORT = env.PORT;
let server: import("http").Server | undefined;

async function startServer(): Promise<void> {
  await ensureDefaultSender();

  server = app.listen(PORT, () => {
    logger.info("Backend server started", {
      port: PORT,
      nodeEnv: env.NODE_ENV
    });
  });
}

void startServer();

let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info("Received shutdown signal", { signal });

  if (!server) {
    logger.warn("Shutdown requested before server was started");
    process.exit(0);
    return;
  }

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
