import path from "node:path";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { connectDatabase } from "./config/db";
import { logger, morganStream } from "./lib/logger";
import { getUploadsRoot } from "./lib/storage";
import { setupSwagger } from "./lib/swagger";
import { errorHandler } from "./middlewares/error.middleware";
import { notFoundHandler } from "./middlewares/notFound.middleware";
import { mongoSanitize } from "./middlewares/sanitize.middleware";
import { globalRateLimiter } from "./middlewares/rate-limit.middleware";
import apiRouter from "./routers";

const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CLIENT_BASE_URL,
    credentials: true,
  }),
);
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(env.COOKIE_SECRET));
app.use(mongoSanitize);
app.use(globalRateLimiter);
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev", { stream: morganStream }));

// Serve uploaded assets (logos, avatars, generated PDFs in dev).
app.use("/uploads", express.static(getUploadsRoot()));

app.use("/api/v1", apiRouter);
setupSwagger(app);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  await connectDatabase();
  app.listen(env.PORT, () => {
    logger.info(`Server running at ${env.APP_BASE_URL} (port ${env.PORT})`);
    logger.info(`API base path: /api/v1 — Docs: /api/docs`);
  });
}

bootstrap().catch((error) => {
  logger.error("Failed to start server", { error: (error as Error).message });
  process.exit(1);
});

export { app };
