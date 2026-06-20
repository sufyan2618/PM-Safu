import type { NextFunction, Request, Response } from "express";
import type { CompanyRole } from "../config/constants";
import { ApiError } from "../utils/apiError";

/**
 * Restricts a route to the given company roles.
 * Must run after requireAuth (and typically tenantMiddleware).
 */
export function requireRole(...roles: CompanyRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    if (!roles.includes(role)) {
      return next(ApiError.forbidden("You do not have permission to perform this action"));
    }
    return next();
  };
}
