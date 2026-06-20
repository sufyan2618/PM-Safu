import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { PDF_JOBS, QUEUE_NAMES } from "../config/constants";
import { logger } from "../lib/logger";
import { InvoiceModel } from "../models/invoice.model";
import { SalarySlipModel } from "../models/salarySlip.model";
import { EmployeeModel } from "../models/employee.model";
import { CompanyModel } from "../models/company.model";
import { buildInvoiceRenderData } from "../lib/pdf/buildInvoiceRenderData";
import { generateInvoicePdf } from "../lib/pdf/generateInvoicePdf";
import { generateSalarySlipPdf } from "../lib/pdf/generateSalarySlipPdf";
import { saveBuffer } from "../lib/storage";
import { monthName } from "../utils/format";
import type { PdfJobData } from "../queues/pdf.queue";

async function handleInvoicePdf(invoiceId: string) {
  const invoice = await InvoiceModel.findById(invoiceId);
  if (!invoice) throw new Error(`Invoice not found: ${invoiceId}`);

  const data = await buildInvoiceRenderData(invoice);
  const buffer = await generateInvoicePdf(data);
  const { url } = await saveBuffer(buffer, `invoices/${invoice.companyId}`, `${invoice.invoiceNumber}.pdf`);

  invoice.pdfUrl = url;
  await invoice.save();
}

async function handleSalarySlipPdf(salarySlipId: string) {
  const slip = await SalarySlipModel.findById(salarySlipId);
  if (!slip) throw new Error(`Salary slip not found: ${salarySlipId}`);

  const [company, employee] = await Promise.all([
    CompanyModel.findById(slip.companyId).select("companyName legalName logoUrl currency"),
    EmployeeModel.findById(slip.employeeId).populate("departmentId", "name"),
  ]);
  if (!employee) throw new Error("Employee not found");
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

  const { url } = await saveBuffer(buffer, `salary-slips/${slip.companyId}`, `${slip._id}.pdf`);
  slip.pdfUrl = url;
  await slip.save();
}

export const pdfWorker = new Worker<PdfJobData>(
  QUEUE_NAMES.PDF,
  async (job) => {
    if (job.data.job === PDF_JOBS.INVOICE) {
      await handleInvoicePdf(job.data.invoiceId);
    } else if (job.data.job === PDF_JOBS.SALARY_SLIP) {
      await handleSalarySlipPdf(job.data.salarySlipId);
    }
  },
  { connection: redis, concurrency: 3 },
);

pdfWorker.on("completed", (job) => logger.info(`PDF job completed: ${job.id} (${job.name})`));
pdfWorker.on("failed", (job, err) =>
  logger.error(`PDF job failed: ${job?.id} (${job?.name}) - ${err.message}`),
);
