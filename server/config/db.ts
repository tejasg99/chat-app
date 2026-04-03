import mongoose from "mongoose";
import { env } from "./env.ts";
import { logger } from "../utils/logger.ts";

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      // Sanitize to prevent NoSQL injection
      sanitizeFilter: true,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(
      `MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
};
