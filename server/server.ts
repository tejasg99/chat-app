import { createServer } from "http";
import app from "./app.ts";
import { connectDB } from "./config/db.ts";
import { env } from "./config/env.ts";
import { logger } from "./utils/logger.ts";
import { initSocket } from "./sockets/index.ts";

const startServer = async (): Promise<void> => {
  await connectDB();

  const httpServer = createServer(app);

  // Initialize Socket.io — must be done on the raw httpServer, not on app
  initSocket(httpServer);

  httpServer.listen(env.port, () => {
    logger.info(`🚀 Server running on port ${env.port} in ${env.nodeEnv} mode`);
    logger.info(`⚡ Socket.io ready`);
  });

  // ─── Graceful Shutdown ────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    httpServer.close(() => {
      logger.info("HTTP server closed");
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
