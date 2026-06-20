import type { Request, Response } from "express";
import { Types } from "mongoose";
import { EmployeeStatus, InvoiceStatus, PayrollStatus } from "../config/constants";
import { InvoiceModel } from "../models/invoice.model";
import { ClientModel } from "../models/client.model";
import { EmployeeModel } from "../models/employee.model";
import { PayrollModel } from "../models/payroll.model";
import { asyncHandler } from "../utils/async-handler";
import { sendSuccess } from "../utils/apiResponse";

function companyObjectId(req: Request) {
  return new Types.ObjectId(String(req.companyId));
}

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenueAgg, outstandingAgg, statusCounts, employeeCount, payrollThisMonth] = await Promise.all([
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
  ]);

  const totalInvoices = statusCounts.reduce((sum, item) => sum + item.count, 0);

  return sendSuccess(res, {
    data: {
      totalRevenue: revenueAgg[0]?.total ?? 0,
      totalOutstanding: outstandingAgg[0]?.total ?? 0,
      totalInvoices,
      invoiceStatusCounts: statusCounts,
      activeEmployees: employeeCount,
      payrollExpenseThisMonth: payrollThisMonth[0]?.total ?? 0,
      monthStart,
    },
  });
});

export const revenueTrend = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const months = Number(req.query.months ?? 6);
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const trend = await InvoiceModel.aggregate([
    { $match: { companyId, status: InvoiceStatus.PAID, updatedAt: { $gte: since } } },
    {
      $group: {
        _id: { year: { $year: "$updatedAt" }, month: { $month: "$updatedAt" } },
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
