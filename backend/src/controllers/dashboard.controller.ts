import type { Request, Response } from "express";
import { Types } from "mongoose";
import { EmployeeStatus, InvoiceStatus, PayrollStatus } from "../config/constants";
import { InvoiceModel } from "../models/invoice.model";
import { ClientModel } from "../models/client.model";
import { EmployeeModel } from "../models/employee.model";
import { DepartmentModel } from "../models/department.model";
import { PayrollModel } from "../models/payroll.model";
import { CompanyModel } from "../models/company.model";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/apiResponse";
import { generateFinancialReportPdf } from "../lib/pdf/generateFinancialReportPdf";

function companyObjectId(req: Request) {
  return new Types.ObjectId(String(req.companyId));
}

/** Percentage change from `prev` to `curr`, rounded to one decimal. */
function pctDelta(curr: number, prev: number): number {
  if (prev <= 0) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 1000) / 10;
}

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthNo = now.getMonth() === 0 ? 12 : now.getMonth();
  const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

  const [
    revenueAgg,
    outstandingAgg,
    statusCounts,
    employeeCount,
    payrollThisMonthAgg,
    revenueThisMonthAgg,
    revenueLastMonthAgg,
    payrollLastMonthAgg,
    departmentCount,
    newHiresThisMonth,
  ] = await Promise.all([
    InvoiceModel.aggregate<{ _id: null; total: number }>([
      { $match: { companyId, status: InvoiceStatus.PAID } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    InvoiceModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          companyId,
          status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountDue" } } },
    ]),
    InvoiceModel.aggregate<{ _id: string; count: number; amount: number }>([
      { $match: { companyId } },
      { $group: { _id: "$status", count: { $sum: 1 }, amount: { $sum: "$grandTotal" } } },
    ]),
    EmployeeModel.countDocuments({ companyId, status: EmployeeStatus.ACTIVE }),
    PayrollModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          companyId,
          status: PayrollStatus.COMPLETED,
          "period.month": now.getMonth() + 1,
          "period.year": now.getFullYear(),
        },
      },
      { $group: { _id: null, total: { $sum: "$totalNet" } } },
    ]),
    InvoiceModel.aggregate<{ _id: null; total: number }>([
      { $match: { companyId, status: InvoiceStatus.PAID, paidOn: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    InvoiceModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          companyId,
          status: InvoiceStatus.PAID,
          paidOn: { $gte: lastMonthStart, $lt: monthStart },
        },
      },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    PayrollModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          companyId,
          status: PayrollStatus.COMPLETED,
          "period.month": lastMonthNo,
          "period.year": lastMonthYear,
        },
      },
      { $group: { _id: null, total: { $sum: "$totalNet" } } },
    ]),
    DepartmentModel.countDocuments({ companyId }),
    EmployeeModel.countDocuments({ companyId, dateOfJoining: { $gte: monthStart } }),
  ]);

  const totalInvoices = statusCounts.reduce((sum, item) => sum + item.count, 0);
  const revenueThisMonth = revenueThisMonthAgg[0]?.total ?? 0;
  const revenueLastMonth = revenueLastMonthAgg[0]?.total ?? 0;
  const payrollThisMonth = payrollThisMonthAgg[0]?.total ?? 0;
  const payrollLastMonth = payrollLastMonthAgg[0]?.total ?? 0;
  const overdueCount = statusCounts.find((s) => s._id === InvoiceStatus.OVERDUE)?.count ?? 0;

  return sendSuccess(res, {
    data: {
      totalRevenue: revenueAgg[0]?.total ?? 0,
      totalOutstanding: outstandingAgg[0]?.total ?? 0,
      totalInvoices,
      invoiceStatusCounts: statusCounts,
      activeEmployees: employeeCount,
      payrollExpenseThisMonth: payrollThisMonth,
      monthStart,
      // Period-over-period comparisons for real KPI deltas
      revenueThisMonth,
      revenueLastMonth,
      revenueDelta: pctDelta(revenueThisMonth, revenueLastMonth),
      payrollExpenseLastMonth: payrollLastMonth,
      payrollDelta: pctDelta(payrollThisMonth, payrollLastMonth),
      overdueCount,
      departmentCount,
      newHiresThisMonth,
    },
  });
});

export const revenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const months = Number(req.query.months ?? 6);
  const from = req.query.from as Date | undefined;
  const to = req.query.to as Date | undefined;

  const since =
    from ??
    (() => {
      const d = new Date();
      d.setMonth(d.getMonth() - months);
      return d;
    })();

  const paidOnMatch: Record<string, unknown> = { $gte: since };
  if (to) paidOnMatch.$lte = to;

  const trend = await InvoiceModel.aggregate([
    { $match: { companyId, status: InvoiceStatus.PAID, paidOn: paidOnMatch } },
    {
      $group: {
        _id: { year: { $year: "$paidOn" }, month: { $month: "$paidOn" } },
        revenue: { $sum: "$grandTotal" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return sendSuccess(res, { data: trend });
});

export const invoiceStatusBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const breakdown = await InvoiceModel.aggregate([
    { $match: { companyId } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$grandTotal" },
        amountDue: { $sum: "$amountDue" },
      },
    },
  ]);
  return sendSuccess(res, { data: breakdown });
});

export const payrollTrend = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const months = Number(req.query.months ?? 6);

  const trend = await PayrollModel.aggregate([
    { $match: { companyId, status: PayrollStatus.COMPLETED } },
    {
      $group: {
        _id: { year: "$period.year", month: "$period.month" },
        totalNet: { $sum: "$totalNet" },
        totalGross: { $sum: "$totalGross" },
        employeeCount: { $sum: "$employeeCount" },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: months },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  return sendSuccess(res, { data: trend });
});

export const outstandingClients = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const limit = Number(req.query.limit ?? 5);

  const clients = await ClientModel.find({ companyId, totalOutstanding: { $gt: 0 } })
    .sort("-totalOutstanding")
    .limit(limit)
    .select("name companyNameOfClient totalOutstanding totalInvoiced");

  return sendSuccess(res, { data: clients });
});

// ── Financial summary (date-ranged) ─────────────────────────────────────────

interface FinancialSummary {
  from: Date;
  to: Date;
  revenue: number;
  payrollExpense: number;
  net: number;
  outstanding: number;
  invoiceStatusBreakdown: { _id: string; count: number; totalAmount: number; amountDue: number }[];
  revenueSeries: { _id: { year: number; month: number }; revenue: number; count: number }[];
  payroll: { net: number; gross: number; deductions: number };
}

function resolveRange(req: Request): { from: Date; to: Date } {
  const to = (req.query.to as Date | undefined) ?? new Date();
  const from =
    (req.query.from as Date | undefined) ?? new Date(to.getFullYear(), to.getMonth() - 5, 1);
  return { from, to };
}

async function computeFinancialSummary(
  companyId: Types.ObjectId,
  from: Date,
  to: Date,
): Promise<FinancialSummary> {
  const [revenueAgg, breakdown, outstandingAgg, payrollAgg, revenueSeries] = await Promise.all([
    InvoiceModel.aggregate<{ _id: null; total: number }>([
      { $match: { companyId, status: InvoiceStatus.PAID, paidOn: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: "$grandTotal" } } },
    ]),
    InvoiceModel.aggregate<{ _id: string; count: number; totalAmount: number; amountDue: number }>([
      { $match: { companyId, issueDate: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          amountDue: { $sum: "$amountDue" },
        },
      },
    ]),
    InvoiceModel.aggregate<{ _id: null; total: number }>([
      {
        $match: {
          companyId,
          status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
      },
      { $group: { _id: null, total: { $sum: "$amountDue" } } },
    ]),
    PayrollModel.aggregate<{ _id: null; totalNet: number; totalGross: number; totalDeductions: number }>([
      { $match: { companyId, status: PayrollStatus.COMPLETED } },
      {
        $addFields: {
          periodDate: { $dateFromParts: { year: "$period.year", month: "$period.month", day: 1 } },
        },
      },
      { $match: { periodDate: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: null,
          totalNet: { $sum: "$totalNet" },
          totalGross: { $sum: "$totalGross" },
          totalDeductions: { $sum: "$totalDeductions" },
        },
      },
    ]),
    InvoiceModel.aggregate<{ _id: { year: number; month: number }; revenue: number; count: number }>([
      { $match: { companyId, status: InvoiceStatus.PAID, paidOn: { $gte: from, $lte: to } } },
      {
        $group: {
          _id: { year: { $year: "$paidOn" }, month: { $month: "$paidOn" } },
          revenue: { $sum: "$grandTotal" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
  ]);

  const revenue = revenueAgg[0]?.total ?? 0;
  const payrollExpense = payrollAgg[0]?.totalNet ?? 0;

  return {
    from,
    to,
    revenue,
    payrollExpense,
    net: revenue - payrollExpense,
    outstanding: outstandingAgg[0]?.total ?? 0,
    invoiceStatusBreakdown: breakdown,
    revenueSeries,
    payroll: {
      net: payrollAgg[0]?.totalNet ?? 0,
      gross: payrollAgg[0]?.totalGross ?? 0,
      deductions: payrollAgg[0]?.totalDeductions ?? 0,
    },
  };
}

export const financialSummary = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const { from, to } = resolveRange(req);
  const summary = await computeFinancialSummary(companyId, from, to);
  return sendSuccess(res, { data: summary });
});

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const { from, to } = resolveRange(req);
  const [summary, company] = await Promise.all([
    computeFinancialSummary(companyId, from, to),
    CompanyModel.findById(companyId).select("companyName legalName currency"),
  ]);

  const buffer = await generateFinancialReportPdf({
    companyName: company?.legalName || company?.companyName || "Company",
    currency: company?.currency ?? "USD",
    from,
    to,
    revenue: summary.revenue,
    payrollExpense: summary.payrollExpense,
    net: summary.net,
    outstanding: summary.outstanding,
    statusBreakdown: summary.invoiceStatusBreakdown,
    revenueSeries: summary.revenueSeries,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="financial-report.pdf"`);
  res.send(buffer);
});
