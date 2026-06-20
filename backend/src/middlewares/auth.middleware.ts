import type { NextFunction, Request, Response } from "express";
import { PlatformScope } from "../config/constants";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken } from "../lib/token";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }
  return null;
}

/** Verifies the access token and attaches `req.user`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    return next(ApiError.unauthorized("Authentication required"));
  }

  try {
    req.user = verifyAccessToken(token);
    return next();
  } catch {
    return next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

/** Requires the authenticated principal to be a super admin. */
export function requireSuperAdmin(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) {
    return next(ApiError.unauthorized("Authentication required"));
  }
  if (req.user.scope !== PlatformScope.SUPER_ADMIN) {
    return next(ApiError.forbidden("Super admin access required"));
  }
  return next();
}
