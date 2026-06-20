import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../lib/logger";

export async function connectDatabase() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");

  mongoose.connection.on("error", (error) => {
    logger.error("MongoDB connection error", { error: (error as Error).message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB disconnected");
  });
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
  logger.info("MongoDB disconnected");
}
