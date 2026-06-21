import { Queue } from "bullmq";
import { redis } from "../config/redis";
import { DEFAULT_QUEUE_JOB_OPTIONS, EMAIL_JOBS, QUEUE_NAMES } from "../config/constants";

export type EmailJobData =
  | { job: typeof EMAIL_JOBS.COMPANY_RECEIVED; to: string; companyName: string }
  | { job: typeof EMAIL_JOBS.COMPANY_APPROVED; to: string; companyName: string }
  | { job: typeof EMAIL_JOBS.COMPANY_REJECTED; to: string; companyName: string; reason: string }
  | {
      job: typeof EMAIL_JOBS.USER_INVITE;
      to: string;
      name: string;
      companyName: string;
      tempPassword: string;
    }
  | { job: typeof EMAIL_JOBS.PASSWORD_RESET; to: string; name: string; token: string; email: string }
  | {
      job: typeof EMAIL_JOBS.EMAIL_VERIFICATION;
      to: string;
      name: string;
      token: string;
      email: string;
    }
  | {
      job: typeof EMAIL_JOBS.INVOICE_TO_CLIENT;
      to: string;
      clientName: string;
      companyName: string;
      invoiceNumber: string;
      amount: string;
      dueDate: string;
      shareUrl: string;
    }
  | {
      job: typeof EMAIL_JOBS.PAYMENT_REMINDER;
      to: string;
      clientName: string;
      companyName: string;
      invoiceNumber: string;
      amountDue: string;
      dueDate: string;
      shareUrl: string;
    }
  | {
      job: typeof EMAIL_JOBS.SALARY_SLIP_SENT;
      to: string;
      employeeName: string;
      companyName: string;
      month: string;
      year: number;
      grossSalary: string;
      netSalary: string;
      slipUrl: string;
    };

export const emailQueue = new Queue<EmailJobData>(QUEUE_NAMES.EMAIL, { connection: redis });

export async function enqueueEmail(data: EmailJobData) {
  await emailQueue.add(data.job, data, DEFAULT_QUEUE_JOB_OPTIONS);
}
