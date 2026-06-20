import type { NextFunction, Request, Response } from "express";
import { MongoServerError } from "mongodb";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { logger } from "../lib/logger";
import { ApiError, type FieldError } from "../utils/apiError";

interface NormalizedError {
  statusCode: number;
  message: string;
  errors?: FieldError[];
}

function normalize(err: unknown): NormalizedError {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, message: err.message, errors: err.errors };
  }

  if (err instanceof ZodError) {
    return {
      statusCode: 400,
      message: "Validation failed",
      errors: err.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message })),
    };
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const errors: FieldError[] = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return { statusCode: 400, message: "Validation failed", errors };
  }

  if (err instanceof mongoose.Error.CastError) {
    return { statusCode: 400, message: `Invalid value for ${err.path}` };
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    const fields = Object.keys(err.keyPattern ?? {});
    return {
      statusCode: 409,
      message: `Duplicate value for ${fields.join(", ") || "a unique field"}`,
      errors: fields.map((field) => ({ field, message: "Already exists" })),
    };
  }

  return { statusCode: 500, message: "Internal server error" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const { statusCode, message, errors } = normalize(err);

  if (statusCode >= 500) {
    logger.error(message, { stack: (err as Error)?.stack });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
  });
}
