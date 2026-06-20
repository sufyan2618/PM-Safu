import type { Request, Response } from "express";
import { CompanyRole, PaymentStatus } from "../config/constants";
import { SalarySlipModel } from "../models/salarySlip.model";
import { EmployeeModel } from "../models/employee.model";
import { CompanyModel } from "../models/company.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";
import { generateSalarySlipPdf } from "../lib/pdf/generateSalarySlipPdf";
import { monthName } from "../utils/format";

/** For STAFF users, restrict slip access to their own linked employee record. */
async function staffEmployeeId(req: Request): Promise<string | null> {
  if (req.user?.role !== CompanyRole.STAFF) return null;
  const employee = await EmployeeModel.findOne({ companyId: req.companyId, userId: req.user.sub }).select("_id");
  return employee ? employee._id.toString() : "none";
}

export const listSalarySlips = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { employeeId, payrollId, month, year, paymentStatus } = req.query as {
    employeeId?: string;
    payrollId?: string;
    month?: number;
    year?: number;
    paymentStatus?: PaymentStatus;
  };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (employeeId) filter.employeeId = employeeId;
  if (payrollId) filter.payrollId = payrollId;
  if (month) filter["period.month"] = month;
  if (year) filter["period.year"] = year;
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const restrictedId = await staffEmployeeId(req);
  if (restrictedId) filter.employeeId = restrictedId;

  const [slips, total] = await Promise.all([
    SalarySlipModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("employeeId", "firstName lastName employeeCode designation"),
    SalarySlipModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: slips, meta: buildMeta(total, page, limit) });
});

async function findSlipForRequest(req: Request) {
  const filter: Record<string, unknown> = { _id: req.params.id, companyId: req.companyId };
  const restrictedId = await staffEmployeeId(req);
  if (restrictedId) filter.employeeId = restrictedId;
  return SalarySlipModel.findOne(filter).populate(
    "employeeId",
    "firstName lastName employeeCode designation departmentId",
  );
}

export const getSalarySlip = asyncHandler(async (req: Request, res: Response) => {
  const slip = await findSlipForRequest(req);
  if (!slip) throw ApiError.notFound("Salary slip not found");
  return sendSuccess(res, { data: slip });
});

export const markSlipPaid = asyncHandler(async (req: Request, res: Response) => {
  const slip = await SalarySlipModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!slip) throw ApiError.notFound("Salary slip not found");

  slip.paymentStatus = PaymentStatus.PAID;
  slip.paidOn = req.body.paidOn ?? new Date();
  await slip.save();

  return sendSuccess(res, { message: "Salary slip marked as paid", data: slip });
});

export const getSalarySlipPdf = asyncHandler(async (req: Request, res: Response) => {
  const slip = await findSlipForRequest(req);
  if (!slip) throw ApiError.notFound("Salary slip not found");

  const [company, employee] = await Promise.all([
    CompanyModel.findById(slip.companyId).select("companyName legalName logoUrl currency"),
    EmployeeModel.findById(slip.employeeId).populate("departmentId", "name"),
  ]);
  if (!employee) throw ApiError.notFound("Employee not found");

  const department = employee.departmentId as unknown as { name?: string } | null;

  const buffer = await generateSalarySlipPdf({
    companyName: company?.legalName || company?.companyName || "Company",
    companyLogoUrl: company?.logoUrl,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    employeeCode: employee.employeeCode,
    designation: employee.designation,
    department: department?.name,
    period: `${monthName(slip.period.month)} ${slip.period.year}`,
    currency: company?.currency ?? "USD",
    baseSalary: slip.baseSalary,
    allowances: slip.allowances,
    deductions: slip.deductions,
    grossSalary: slip.grossSalary,
    totalDeductions: slip.totalDeductions,
    netSalary: slip.netSalary,
    workingDays: slip.workingDays,
    presentDays: slip.presentDays,
    paymentStatus: slip.paymentStatus,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="salary-slip-${employee.employeeCode}.pdf"`);
  res.send(buffer);
});
