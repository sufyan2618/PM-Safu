import type { NextFunction, Request, Response } from "express";
import { CompanyStatus } from "../config/constants";
import { CompanyModel } from "../models/company.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/async-handler";

/**
 * Tenant isolation gate. Runs after requireAuth on every company-scoped route.
 * Derives companyId strictly from the JWT (never the request body/params/query),
 * loads the company, and verifies it is approved + active.
 */
export const tenantMiddleware = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    throw ApiError.unauthorized("Authentication required");
  }
  if (!user.companyId) {
    throw ApiError.forbidden("This endpoint requires a company account");
  }

  const company = await CompanyModel.findById(user.companyId).select("status isActive onboardingCompleted");
  if (!company) {
    throw ApiError.forbidden("Company not found");
  }

  if (company.status === CompanyStatus.PENDING) {
    throw ApiError.forbidden("Your company registration is still pending approval");
  }
  if (company.status === CompanyStatus.REJECTED) {
    throw ApiError.forbidden("Your company registration has been rejected");
  }
  if (!company.isActive) {
    throw ApiError.forbidden("Your company account has been suspended");
  }

  req.companyId = user.companyId;
  next();
});
