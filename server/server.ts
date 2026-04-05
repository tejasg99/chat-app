import { createServer } from "http";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";
import { env } from "./config/env.ts";
import { logger } from "./utils/logger.ts";
import { initSocket } from "./sockets/index.ts";
import { redisClient } from "./config/redis.ts";

const startServer = async (): Promise<void> => {
  await connectDB();

  // ─── Connect standalone Redis client (used for caching) ──────────────────
  // The pub/sub clients for Socket.io are connected inside initSocket()
  await redisClient.connect();
  logger.info("Redis cache client connected");

  const httpServer = createServer(app);

  // ─── Initialize Socket.io with Redis adapter ──────────────────────────────
  await initSocket(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
    logger.info(`⚡ Socket.io ready`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`${signal} received — shutting down gracefully`);

    httpServer.close(async () => {
      logger.info("HTTP server closed");

      // Disconnect Redis before exiting
      await redisClient.quit();
      logger.info("Redis client disconnected");

      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason: unknown) => {
    logger.error({ reason }, "Unhandled Rejection");
    process.exit(1);
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error({ err: error }, "Uncaught Exception");
    process.exit(1);
  });
};

startServer();
