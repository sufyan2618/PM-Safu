import type { Request, Response } from "express";
import { CompanyModel } from "../models/company.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { saveBuffer } from "../lib/storage";
import { seedDefaultTemplates } from "../utils/seedTemplates";

export const getMyCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");
  return sendSuccess(res, { data: company });
});

export const setupCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  const { completeOnboarding, currency, ...rest } = req.body;

  Object.assign(company, rest);
  if (currency) company.currency = String(currency).toUpperCase();
  if (rest.website === "") company.website = undefined;

  if (completeOnboarding) {
    const hasRequired = Boolean(
      company.legalName && company.address?.city && company.address?.country && company.currency,
    );
    if (!hasRequired) {
      throw ApiError.badRequest(
        "Please provide legal name, city, country and currency before completing onboarding",
      );
    }
    company.onboardingCompleted = true;
  }

  await company.save();

  if (company.onboardingCompleted) {
    await seedDefaultTemplates(company._id, {
      brandColor: company.brandColor,
      logoUrl: company.logoUrl,
      createdBy: req.user?.sub as never,
    });
  }

  return sendSuccess(res, { message: "Company updated", data: company });
});

export const uploadLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No file uploaded");

  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  const { url } = await saveBuffer(req.file.buffer, `logos/${req.companyId}`, req.file.originalname);
  company.logoUrl = url;
  await company.save();

  return sendSuccess(res, { message: "Logo uploaded", data: { logoUrl: url } });
});

export const updateInvoiceSettings = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  company.invoiceSettings = {
    ...company.invoiceSettings,
    ...req.body,
  } as typeof company.invoiceSettings;
  await company.save();

  return sendSuccess(res, { message: "Invoice settings updated", data: company.invoiceSettings });
});

export const updatePayrollSettings = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.companyId);
  if (!company) throw ApiError.notFound("Company not found");

  company.payrollSettings = {
    ...company.payrollSettings,
    ...req.body,
  } as typeof company.payrollSettings;
  await company.save();

  return sendSuccess(res, { message: "Payroll settings updated", data: company.payrollSettings });
});
