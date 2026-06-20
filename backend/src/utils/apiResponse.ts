import type { Response } from "express";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SuccessOptions<T> {
  message?: string;
  data?: T;
  meta?: PaginationMeta;
  statusCode?: number;
}

export function sendSuccess<T>(res: Response, options: SuccessOptions<T> = {}) {
  const { message = "Success", data, meta, statusCode = 200 } = options;
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== undefined ? { data } : {}),
    ...(meta ? { meta } : {}),
  });
}

export function sendCreated<T>(res: Response, options: Omit<SuccessOptions<T>, "statusCode"> = {}) {
  return sendSuccess(res, { ...options, statusCode: 201 });
}
