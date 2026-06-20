import type { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../utils/async-handler";
import { buildWorkbookBuffer, type ExcelColumn } from "../lib/excel/buildWorkbook";
import { InvoiceModel } from "../models/invoice.model";
import { ClientModel } from "../models/client.model";
import { EmployeeModel } from "../models/employee.model";
import { PayrollModel } from "../models/payroll.model";
import { SalarySlipModel } from "../models/salarySlip.model";

function companyObjectId(req: Request) {
  return new Types.ObjectId(String(req.companyId));
}

function fmtDate(value?: Date | null): string {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function fmtPeriod(period?: { month: number; year: number }): string {
  if (!period) return "";
  return `${period.year}-${String(period.month).padStart(2, "0")}`;
}

async function sendWorkbook(
  res: Response,
  filename: string,
  sheetName: string,
  columns: ExcelColumn[],
  rows: Record<string, unknown>[],
) {
  const buffer = await buildWorkbookBuffer(sheetName, columns, rows);
  const stamped = `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );
  res.setHeader("Content-Disposition", `attachment; filename="${stamped}"`);
  res.send(buffer);
}

export const exportInvoices = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const filter: Record<string, unknown> = { companyId };
  if (req.query.status) filter.status = req.query.status;

  const invoices = await InvoiceModel.find(filter)
    .populate<{ clientId: { name: string; companyNameOfClient?: string } }>(
      "clientId",
      "name companyNameOfClient",
    )
    .sort("-issueDate")
    .lean();

  const columns: ExcelColumn[] = [
    { header: "Invoice #", key: "number", width: 18 },
    { header: "Client", key: "client", width: 26 },
    { header: "Status", key: "status", width: 16 },
    { header: "Issue Date", key: "issueDate", width: 14 },
    { header: "Due Date", key: "dueDate", width: 14 },
    { header: "Currency", key: "currency", width: 10 },
    { header: "Subtotal", key: "subTotal", width: 14 },
    { header: "Tax", key: "totalTax", width: 12 },
    { header: "Discount", key: "totalDiscount", width: 12 },
    { header: "Grand Total", key: "grandTotal", width: 14 },
    { header: "Amount Paid", key: "amountPaid", width: 14 },
    { header: "Amount Due", key: "amountDue", width: 14 },
    { header: "Paid On", key: "paidOn", width: 14 },
  ];

  const rows = invoices.map((inv) => {
    const client = inv.clientId as unknown as { name?: string; companyNameOfClient?: string } | null;
    return {
      number: inv.invoiceNumber,
      client: client?.companyNameOfClient || client?.name || "",
      status: inv.status,
      issueDate: fmtDate(inv.issueDate),
      dueDate: fmtDate(inv.dueDate),
      currency: inv.currency,
      subTotal: inv.subTotal,
      totalTax: inv.totalTax,
      totalDiscount: inv.totalDiscount,
      grandTotal: inv.grandTotal,
      amountPaid: inv.amountPaid,
      amountDue: inv.amountDue,
      paidOn: fmtDate(inv.paidOn),
    };
  });

  await sendWorkbook(res, "invoices", "Invoices", columns, rows);
});

export const exportClients = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const clients = await ClientModel.find({ companyId }).sort("name").lean();

  const columns: ExcelColumn[] = [
    { header: "Name", key: "name", width: 24 },
    { header: "Company", key: "company", width: 24 },
    { header: "Email", key: "email", width: 26 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Tax ID", key: "taxId", width: 18 },
    { header: "Active", key: "active", width: 10 },
    { header: "Total Invoiced", key: "totalInvoiced", width: 16 },
    { header: "Outstanding", key: "outstanding", width: 16 },
    { header: "Created", key: "created", width: 14 },
  ];

  const rows = clients.map((c) => ({
    name: c.name,
    company: c.companyNameOfClient ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    taxId: c.taxId ?? "",
    active: c.isActive ? "Yes" : "No",
    totalInvoiced: c.totalInvoiced,
    outstanding: c.totalOutstanding,
    created: fmtDate(c.createdAt),
  }));

  await sendWorkbook(res, "clients", "Clients", columns, rows);
});

export const exportEmployees = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const filter: Record<string, unknown> = { companyId };
  if (req.query.status) filter.status = req.query.status;

  const employees = await EmployeeModel.find(filter)
    .populate<{ departmentId: { name: string } }>("departmentId", "name")
    .sort("employeeCode")
    .lean();

  const columns: ExcelColumn[] = [
    { header: "Code", key: "code", width: 14 },
    { header: "First Name", key: "firstName", width: 18 },
    { header: "Last Name", key: "lastName", width: 18 },
    { header: "Email", key: "email", width: 26 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Department", key: "department", width: 20 },
    { header: "Designation", key: "designation", width: 20 },
    { header: "Type", key: "type", width: 14 },
    { header: "Status", key: "status", width: 12 },
    { header: "Joined", key: "joined", width: 14 },
    { header: "Bank", key: "bank", width: 20 },
    { header: "Account #", key: "account", width: 20 },
  ];

  const rows = employees.map((e) => {
    const dept = e.departmentId as unknown as { name?: string } | null;
    return {
      code: e.employeeCode,
      firstName: e.firstName,
      lastName: e.lastName,
      email: e.email,
      phone: e.phone ?? "",
      department: dept?.name ?? "",
      designation: e.designation,
      type: e.employmentType,
      status: e.status,
      joined: fmtDate(e.dateOfJoining),
      bank: e.bankDetails?.bankName ?? "",
      account: e.bankDetails?.accountNumber ?? "",
    };
  });

  await sendWorkbook(res, "employees", "Employees", columns, rows);
});

export const exportPayroll = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const payrolls = await PayrollModel.find({ companyId })
    .sort("-period.year -period.month")
    .lean();

  const columns: ExcelColumn[] = [
    { header: "Period", key: "period", width: 12 },
    { header: "Status", key: "status", width: 14 },
    { header: "Employees", key: "employees", width: 12 },
    { header: "Total Gross", key: "gross", width: 16 },
    { header: "Total Deductions", key: "deductions", width: 18 },
    { header: "Total Net", key: "net", width: 16 },
    { header: "Processed At", key: "processedAt", width: 16 },
  ];

  const rows = payrolls.map((p) => ({
    period: fmtPeriod(p.period),
    status: p.status,
    employees: p.employeeCount,
    gross: p.totalGross,
    deductions: p.totalDeductions,
    net: p.totalNet,
    processedAt: fmtDate(p.processedAt),
  }));

  await sendWorkbook(res, "payroll", "Payroll", columns, rows);
});

export const exportSalarySlips = asyncHandler(async (req: Request, res: Response) => {
  const companyId = companyObjectId(req);
  const filter: Record<string, unknown> = { companyId };
  if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

  const slips = await SalarySlipModel.find(filter)
    .populate<{ employeeId: { firstName: string; lastName: string; employeeCode: string } }>(
      "employeeId",
      "firstName lastName employeeCode",
    )
    .sort("-period.year -period.month")
    .lean();

  const columns: ExcelColumn[] = [
    { header: "Employee Code", key: "code", width: 16 },
    { header: "Employee", key: "employee", width: 26 },
    { header: "Period", key: "period", width: 12 },
    { header: "Base Salary", key: "base", width: 14 },
    { header: "Gross", key: "gross", width: 14 },
    { header: "Deductions", key: "deductions", width: 14 },
    { header: "Net", key: "net", width: 14 },
    { header: "Payment Status", key: "paymentStatus", width: 16 },
    { header: "Paid On", key: "paidOn", width: 14 },
  ];

  const rows = slips.map((s) => {
    const emp = s.employeeId as unknown as {
      firstName?: string;
      lastName?: string;
      employeeCode?: string;
    } | null;
    return {
      code: emp?.employeeCode ?? "",
      employee: `${emp?.firstName ?? ""} ${emp?.lastName ?? ""}`.trim(),
      period: fmtPeriod(s.period),
      base: s.baseSalary,
      gross: s.grossSalary,
      deductions: s.totalDeductions,
      net: s.netSalary,
      paymentStatus: s.paymentStatus,
      paidOn: fmtDate(s.paidOn),
    };
  });

  await sendWorkbook(res, "salary-slips", "Salary Slips", columns, rows);
});
