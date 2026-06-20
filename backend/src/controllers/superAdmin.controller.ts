import type { Request, Response } from "express";
import { CompanyStatus, EMAIL_JOBS, InvoiceStatus, UserType } from "../config/constants";
import { CompanyModel } from "../models/company.model";
import { UserModel } from "../models/user.model";
import { InvoiceModel } from "../models/invoice.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";
import { enqueueEmail } from "../queues/email.queue";
import { recordAudit } from "../utils/audit";

export const listCompanies = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { status, isActive, search } = req.query as {
    status?: CompanyStatus;
    isActive?: boolean;
    search?: string;
  };

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (typeof isActive === "boolean") filter.isActive = isActive;
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: "i" } },
      { registrationEmail: { $regex: search, $options: "i" } },
    ];
  }

  const [companies, total] = await Promise.all([
    CompanyModel.find(filter).sort(sort).skip(skip).limit(limit),
    CompanyModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: companies, meta: buildMeta(total, page, limit) });
});

export const getCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.params.id).populate("reviewedBy", "name email");
  if (!company) throw ApiError.notFound("Company not found");
  const userCount = await UserModel.countDocuments({ companyId: company._id });
  return sendSuccess(res, { data: { company, userCount } });
});

export const approveCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.params.id);
  if (!company) throw ApiError.notFound("Company not found");
  if (company.status === CompanyStatus.APPROVED) {
    throw ApiError.badRequest("Company is already approved");
  }

  company.status = CompanyStatus.APPROVED;
  company.rejectionReason = undefined;
  company.reviewedBy = req.user?.sub as never;
  company.reviewedAt = new Date();
  await company.save();

  await enqueueEmail({
    job: EMAIL_JOBS.COMPANY_APPROVED,
    to: company.registrationEmail,
    companyName: company.companyName,
  });

  await recordAudit({
    actorId: req.user!.sub,
    actorType: UserType.SUPER_ADMIN,
    action: "company.approved",
    targetType: "Company",
    targetId: company._id,
    ipAddress: req.ip,
  });

  return sendSuccess(res, { message: "Company approved", data: company });
});

export const rejectCompany = asyncHandler(async (req: Request, res: Response) => {
  const { reason } = req.body;
  const company = await CompanyModel.findById(req.params.id);
  if (!company) throw ApiError.notFound("Company not found");

  company.status = CompanyStatus.REJECTED;
  company.rejectionReason = reason;
  company.reviewedBy = req.user?.sub as never;
  company.reviewedAt = new Date();
  await company.save();

  await enqueueEmail({
    job: EMAIL_JOBS.COMPANY_REJECTED,
    to: company.registrationEmail,
    companyName: company.companyName,
    reason,
  });

  await recordAudit({
    actorId: req.user!.sub,
    actorType: UserType.SUPER_ADMIN,
    action: "company.rejected",
    targetType: "Company",
    targetId: company._id,
    metadata: { reason },
    ipAddress: req.ip,
  });

  return sendSuccess(res, { message: "Company rejected", data: company });
});

export const suspendCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.params.id);
  if (!company) throw ApiError.notFound("Company not found");
  if (company.status !== CompanyStatus.APPROVED) {
    throw ApiError.badRequest("Only approved companies can be suspended");
  }

  company.isActive = false;
  await company.save();

  await recordAudit({
    actorId: req.user!.sub,
    actorType: UserType.SUPER_ADMIN,
    action: "company.suspended",
    targetType: "Company",
    targetId: company._id,
    ipAddress: req.ip,
  });

  return sendSuccess(res, { message: "Company suspended", data: company });
});

export const reactivateCompany = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.params.id);
  if (!company) throw ApiError.notFound("Company not found");

  company.isActive = true;
  await company.save();

  await recordAudit({
    actorId: req.user!.sub,
    actorType: UserType.SUPER_ADMIN,
    action: "company.reactivated",
    targetType: "Company",
    targetId: company._id,
    ipAddress: req.ip,
  });

  return sendSuccess(res, { message: "Company reactivated", data: company });
});

export const listCompanyUsers = asyncHandler(async (req: Request, res: Response) => {
  const company = await CompanyModel.findById(req.params.id);
  if (!company) throw ApiError.notFound("Company not found");
  const users = await UserModel.find({ companyId: company._id }).sort("-createdAt");
  return sendSuccess(res, { data: users });
});

export const platformDashboard = asyncHandler(async (_req: Request, res: Response) => {
  const [totalCompanies, pendingCompanies, approvedCompanies, activeUsers, totalInvoices, revenueAgg] =
    await Promise.all([
      CompanyModel.countDocuments({}),
      CompanyModel.countDocuments({ status: CompanyStatus.PENDING }),
      CompanyModel.countDocuments({ status: CompanyStatus.APPROVED }),
      UserModel.countDocuments({ isActive: true }),
      InvoiceModel.countDocuments({}),
      InvoiceModel.aggregate<{ _id: null; total: number }>([
        { $match: { status: InvoiceStatus.PAID } },
        { $group: { _id: null, total: { $sum: "$grandTotal" } } },
      ]),
    ]);

  return sendSuccess(res, {
    data: {
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      activeUsers,
      totalInvoices,
      totalRevenueProcessed: revenueAgg[0]?.total ?? 0,
    },
  });
});
