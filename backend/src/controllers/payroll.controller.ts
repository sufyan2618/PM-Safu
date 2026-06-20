import type { Request, Response } from "express";
import { Types } from "mongoose";
import { EmployeeStatus, PAYROLL_JOBS, PayrollStatus } from "../config/constants";
import { env } from "../config/env";
import { PayrollModel } from "../models/payroll.model";
import { SalarySlipModel } from "../models/salarySlip.model";
import { EmployeeModel } from "../models/employee.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendCreated, sendSuccess } from "../utils/apiResponse";
import { buildMeta, getPagination } from "../utils/pagination";
import { processPayrollRun } from "../lib/payroll/processPayrollRun";
import { enqueuePayrollRun } from "../queues/payroll.queue";

export const listPayroll = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip, sort } = getPagination(req.query);
  const { year, status } = req.query as { year?: number; status?: PayrollStatus };

  const filter: Record<string, unknown> = { companyId: req.companyId };
  if (year) filter["period.year"] = year;
  if (status) filter.status = status;

  const [runs, total] = await Promise.all([
    PayrollModel.find(filter).sort(sort).skip(skip).limit(limit),
    PayrollModel.countDocuments(filter),
  ]);

  return sendSuccess(res, { data: runs, meta: buildMeta(total, page, limit) });
});

export const processPayroll = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.companyId!;
  const { month, year, employeeIds, notes } = req.body;

  const existing = await PayrollModel.findOne({ companyId, "period.year": year, "period.month": month });
  if (existing && existing.status === PayrollStatus.COMPLETED) {
    throw ApiError.conflict("Payroll for this period is already finalized");
  }

  const payroll =
    existing ??
    (await PayrollModel.create({
      companyId,
      period: { month, year },
      status: PayrollStatus.DRAFT,
      processedBy: req.user?.sub,
      notes,
    }));

  if (notes !== undefined) {
    payroll.notes = notes;
    payroll.processedBy = req.user?.sub as never;
    await payroll.save();
  }

  const employeeFilter: Record<string, unknown> = { companyId, status: EmployeeStatus.ACTIVE };
  if (employeeIds && employeeIds.length > 0) employeeFilter._id = { $in: employeeIds };
  const activeCount = await EmployeeModel.countDocuments(employeeFilter);

  if (activeCount === 0) {
    throw ApiError.badRequest("No active employees found for this payroll run");
  }

  // Large companies process in the background to keep the request snappy.
  if (activeCount > env.PAYROLL_SYNC_THRESHOLD) {
    await enqueuePayrollRun({
      job: PAYROLL_JOBS.PROCESS_RUN,
      payrollId: payroll._id.toString(),
      companyId: companyId.toString(),
      employeeIds,
    });
    return sendCreated(res, {
      message: "Payroll run queued for processing",
      data: { payrollId: payroll._id.toString(), status: "processing", queued: true },
    });
  }

  await processPayrollRun({ payrollId: payroll._id, companyId, employeeIds });
  const refreshed = await PayrollModel.findById(payroll._id);
  return sendCreated(res, { message: "Payroll processed", data: refreshed });
});

export const getPayroll = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) throw ApiError.notFound("Payroll run not found");
  return sendSuccess(res, { data: payroll });
});

export const getPayrollSlips = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) throw ApiError.notFound("Payroll run not found");

  const slips = await SalarySlipModel.find({ companyId: req.companyId, payrollId: payroll._id })
    .populate("employeeId", "firstName lastName employeeCode designation");

  return sendSuccess(res, { data: slips });
});

export const finalizePayroll = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) throw ApiError.notFound("Payroll run not found");
  if (payroll.status === PayrollStatus.COMPLETED) {
    throw ApiError.badRequest("Payroll is already finalized");
  }
  if (payroll.status === PayrollStatus.PROCESSING) {
    throw ApiError.badRequest("Payroll is still processing");
  }

  const slipCount = await SalarySlipModel.countDocuments({
    companyId: req.companyId,
    payrollId: payroll._id,
  });
  if (slipCount === 0) {
    throw ApiError.badRequest("Cannot finalize a payroll run with no salary slips");
  }

  payroll.status = PayrollStatus.COMPLETED;
  payroll.processedBy = req.user?.sub as never;
  payroll.processedAt = new Date();
  await payroll.save();

  return sendSuccess(res, { message: "Payroll finalized", data: payroll });
});

export const deletePayroll = asyncHandler(async (req: Request, res: Response) => {
  const payroll = await PayrollModel.findOne({ _id: req.params.id, companyId: req.companyId });
  if (!payroll) throw ApiError.notFound("Payroll run not found");
  if (payroll.status === PayrollStatus.COMPLETED) {
    throw ApiError.badRequest("Cannot delete a finalized payroll run");
  }

  await SalarySlipModel.deleteMany({ companyId: req.companyId, payrollId: payroll._id });
  await payroll.deleteOne();

  return sendSuccess(res, { message: "Payroll run deleted" });
});

export const payrollSummaryReport = asyncHandler(async (req: Request, res: Response) => {
  const summary = await PayrollModel.aggregate([
    {
      $match: {
        companyId: new Types.ObjectId(String(req.companyId)),
        status: PayrollStatus.COMPLETED,
      },
    },
    {
      $group: {
        _id: { year: "$period.year", month: "$period.month" },
        totalGross: { $sum: "$totalGross" },
        totalNet: { $sum: "$totalNet" },
        totalDeductions: { $sum: "$totalDeductions" },
        employeeCount: { $sum: "$employeeCount" },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return sendSuccess(res, { data: summary });
});
