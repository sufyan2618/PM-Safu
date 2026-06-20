import { Queue } from "bullmq";
import { redis } from "../config/redis";
import { DEFAULT_QUEUE_JOB_OPTIONS, PDF_JOBS, QUEUE_NAMES } from "../config/constants";

export type PdfJobData =
  | { job: typeof PDF_JOBS.INVOICE; invoiceId: string }
  | { job: typeof PDF_JOBS.SALARY_SLIP; salarySlipId: string };

export const pdfQueue = new Queue<PdfJobData>(QUEUE_NAMES.PDF, { connection: redis });

export async function enqueuePdf(data: PdfJobData) {
  await pdfQueue.add(data.job, data, DEFAULT_QUEUE_JOB_OPTIONS);
}
