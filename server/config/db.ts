import mongoose from "mongoose";
import { logger } from "../utils/logger";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

const connectDB = async (retries: number = MAX_RETRIES): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not defined in environment variables.");
  }

  try {
    const connection = await mongoose.connect(mongoUri, {
      // good defaults for production
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(`✅ MongoDB Connected: ${connection.connection.host}`);

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected.");
    });
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error}`);

    if (retries > 0) {
      logger.warn(
        `Retrying MongoDB connection in ${RETRY_DELAY_MS / 1000}s... (${retries} retries left)`,
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    logger.error("Max MongoDB connection retries reached. Exiting...");
    process.exit(1);
  }
};

export default connectDB;
