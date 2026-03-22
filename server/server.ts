import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db";
import { logger } from "./utils/logger";

const PORT = parseInt(process.env.PORT ?? "5000", 10);

const startServer = async (): Promise<void> => {
  // ── 1. Connect to MongoDB ─────────────────────────────────────────────
  await connectDB();

  // ── 2. Create HTTP Server ─────────────────────────────────────────────
  const server = http.createServer(app);

  // ── 3. Start Listening ────────────────────────────────────────────────
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    logger.info(`📡 Health check: http://localhost:${PORT}/api/health`);
  });

  // ── 4. Graceful Shutdown ──────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    logger.warn(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      logger.info("HTTP server closed.");
      // Mongoose disconnect happens automatically, but being explicit:
      const mongoose = await import("mongoose");
      await mongoose.default.connection.close();
      logger.info("MongoDB connection closed.");
      process.exit(0);
    });

    // Force shutdown after 10 seconds if graceful shutdown fails
    setTimeout(() => {
      logger.error("Forced shutdown after timeout.");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  // ── 5. Handle Unhandled Rejections & Exceptions ───────────────────────
  process.on("unhandledRejection", (reason: unknown) => {
    logger.error({ reason }, "Unhandled Promise Rejection");
    server.close(() => process.exit(1));
  });

  process.on("uncaughtException", (error: Error) => {
    logger.error({ error }, "Uncaught Exception");
    process.exit(1);
  });
};

startServer();
