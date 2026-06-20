import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { EMAIL_JOBS, InvoiceStatus, QUEUE_NAMES, REMINDER_JOBS } from "../config/constants";
import { env } from "../config/env";
import { logger } from "../lib/logger";
import { InvoiceModel } from "../models/invoice.model";
import { ClientModel } from "../models/client.model";
import { CompanyModel } from "../models/company.model";
import { enqueueEmail } from "../queues/email.queue";
import { formatCurrency } from "../utils/format";

async function checkOverdueInvoices(): Promise<number> {
  const result = await InvoiceModel.updateMany(
    {
      status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
      dueDate: { $lt: new Date() },
      amountDue: { $gt: 0 },
    },
    { $set: { status: InvoiceStatus.OVERDUE } },
  );
  logger.info(`Overdue check: ${result.modifiedCount} invoices marked overdue`);
  return result.modifiedCount;
}

async function sendDueSoonReminders(): Promise<number> {
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);

  const invoices = await InvoiceModel.find({
    status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
    amountDue: { $gt: 0 },
    dueDate: { $lte: soon },
    shareToken: { $exists: true, $ne: null },
  }).limit(500);

  let sent = 0;
  for (const invoice of invoices) {
    const [client, company] = await Promise.all([
      ClientModel.findById(invoice.clientId).select("name email"),
      CompanyModel.findById(invoice.companyId).select("companyName"),
    ]);
    if (!client?.email) continue;

    await enqueueEmail({
      job: EMAIL_JOBS.PAYMENT_REMINDER,
      to: client.email,
      clientName: client.name,
      companyName: company?.companyName ?? "",
      invoiceNumber: invoice.invoiceNumber,
      amountDue: formatCurrency(invoice.amountDue, invoice.currency),
      dueDate: invoice.dueDate.toLocaleDateString(),
      shareUrl: `${env.CLIENT_BASE_URL}/invoices/public/${invoice.shareToken}`,
    });
    sent += 1;
  }
  logger.info(`Due-soon reminders enqueued: ${sent}`);
  return sent;
}

export const reminderWorker = new Worker(
  QUEUE_NAMES.REMINDER,
  async (job) => {
    if (job.name === REMINDER_JOBS.CHECK_OVERDUE) {
      return checkOverdueInvoices();
    }
    if (job.name === REMINDER_JOBS.DUE_SOON) {
      return sendDueSoonReminders();
    }
    return undefined;
  },
  { connection: redis, concurrency: 1 },
);

reminderWorker.on("completed", (job) => logger.info(`Reminder job completed: ${job.id} (${job.name})`));
reminderWorker.on("failed", (job, err) =>
  logger.error(`Reminder job failed: ${job?.id} (${job?.name}) - ${err.message}`),
);
