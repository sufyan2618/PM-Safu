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
import { createNotification } from "../lib/notifications/createNotification";

async function checkOverdueInvoices(): Promise<number> {
  const overdueInvoices = await InvoiceModel.find({
    status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID] },
    dueDate: { $lt: new Date() },
    amountDue: { $gt: 0 },
  }).select("_id companyId invoiceNumber");

  if (overdueInvoices.length > 0) {
    await InvoiceModel.updateMany(
      { _id: { $in: overdueInvoices.map((i) => i._id) } },
      { $set: { status: InvoiceStatus.OVERDUE } },
    );

    // Group by company and create one notification per company.
    const byCompany = new Map<string, typeof overdueInvoices>();
    for (const inv of overdueInvoices) {
      const key = inv.companyId.toString();
      if (!byCompany.has(key)) byCompany.set(key, []);
      byCompany.get(key)!.push(inv);
    }
    for (const [, invoices] of byCompany) {
      const count = invoices.length;
      void createNotification({
        companyId: invoices[0].companyId,
        type: "invoice_overdue",
        title: count === 1 ? "Invoice overdue" : `${count} invoices overdue`,
        body:
          count === 1
            ? `Invoice ${invoices[0].invoiceNumber} is now overdue.`
            : `${count} invoices are now overdue and require follow-up.`,
        link: "/invoices?status=overdue",
      });
    }
  }

  logger.info(`Overdue check: ${overdueInvoices.length} invoices marked overdue`);
  return overdueInvoices.length;
}

/** Minimum days between consecutive reminders for the same invoice (anti-spam). */
const REMINDER_COOLDOWN_DAYS = 3;

async function sendDueSoonReminders(): Promise<number> {
  const now = new Date();
  const soon = new Date();
  soon.setDate(soon.getDate() + 3);
  const cooldownCutoff = new Date(now.getTime() - REMINDER_COOLDOWN_DAYS * 86400000);

  const invoices = await InvoiceModel.find({
    status: { $in: [InvoiceStatus.SENT, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
    amountDue: { $gt: 0 },
    dueDate: { $lte: soon },
    shareToken: { $exists: true, $ne: null },
    // Skip invoices reminded within the cooldown window.
    $or: [{ lastReminderAt: { $exists: false } }, { lastReminderAt: { $lte: cooldownCutoff } }],
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
      shareUrl: `${env.CLIENT_BASE_URL}/invoice/share/${invoice.shareToken}`,
    });

    invoice.lastReminderAt = now;
    invoice.reminderCount = (invoice.reminderCount ?? 0) + 1;
    await invoice.save();
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
