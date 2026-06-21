import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { EMAIL_JOBS, QUEUE_NAMES } from "../config/constants";
import { logger } from "../lib/logger";
import { sendEmail } from "../lib/email/sendEmail";
import {
  companyApprovedTemplate,
  companyReceivedTemplate,
  companyRejectedTemplate,
  emailVerificationTemplate,
  invoiceToClientTemplate,
  passwordResetTemplate,
  paymentReminderTemplate,
  salarySlipTemplate,
  userInviteTemplate,
} from "../templates/email-templates";
import type { EmailJobData } from "../queues/email.queue";

function buildEmail(data: EmailJobData): { subject: string; html: string; toName?: string } {
  switch (data.job) {
    case EMAIL_JOBS.COMPANY_RECEIVED:
      return { subject: "We received your application", html: companyReceivedTemplate(data.companyName) };
    case EMAIL_JOBS.COMPANY_APPROVED:
      return { subject: "Your company has been approved", html: companyApprovedTemplate(data.companyName) };
    case EMAIL_JOBS.COMPANY_REJECTED:
      return {
        subject: "Update on your registration",
        html: companyRejectedTemplate(data.companyName, data.reason),
      };
    case EMAIL_JOBS.USER_INVITE:
      return {
        subject: `You've been invited to ${data.companyName}`,
        html: userInviteTemplate(data.name, data.companyName, data.tempPassword),
        toName: data.name,
      };
    case EMAIL_JOBS.PASSWORD_RESET:
      return {
        subject: "Reset your password",
        html: passwordResetTemplate(data.name, data.token, data.email),
        toName: data.name,
      };
    case EMAIL_JOBS.EMAIL_VERIFICATION:
      return {
        subject: "Verify your email address",
        html: emailVerificationTemplate(data.name, data.token, data.email),
        toName: data.name,
      };
    case EMAIL_JOBS.INVOICE_TO_CLIENT:
      return {
        subject: `Invoice ${data.invoiceNumber} from ${data.companyName}`,
        html: invoiceToClientTemplate(data),
        toName: data.clientName,
      };
    case EMAIL_JOBS.PAYMENT_REMINDER:
      return {
        subject: `Payment reminder: Invoice ${data.invoiceNumber}`,
        html: paymentReminderTemplate(data),
        toName: data.clientName,
      };
    case EMAIL_JOBS.SALARY_SLIP_SENT:
      return {
        subject: `Your salary slip for ${data.month} ${data.year} is ready`,
        html: salarySlipTemplate(data),
        toName: data.employeeName,
      };
    default:
      throw new Error(`Unknown email job: ${(data as { job: string }).job}`);
  }
}

export const emailWorker = new Worker<EmailJobData>(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    const { subject, html, toName } = buildEmail(job.data);
    await sendEmail({ to: job.data.to, toName, subject, html });
  },
  { connection: redis, concurrency: 5 },
);

emailWorker.on("completed", (job) => logger.info(`Email job completed: ${job.id} (${job.name})`));
emailWorker.on("failed", (job, err) =>
  logger.error(`Email job failed: ${job?.id} (${job?.name}) - ${err.message}`),
);
