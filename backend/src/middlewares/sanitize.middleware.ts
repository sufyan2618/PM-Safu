import type { NextFunction, Request, Response } from "express";

/**
 * Strips MongoDB operator keys ($ prefixed, or containing dots) from incoming
 * objects to mitigate NoSQL injection. Express 5 exposes req.query as a getter,
 * so we only deep-sanitize the body and params in place.
 */
function sanitize(value: unknown): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const item of value) sanitize(item);
    return;
  }
  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete (value as Record<string, unknown>)[key];
    } else {
      sanitize((value as Record<string, unknown>)[key]);
    }
  }
}

export function mongoSanitize(req: Request, _res: Response, next: NextFunction) {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  next();
}
