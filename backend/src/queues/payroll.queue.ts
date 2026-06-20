import { Queue } from "bullmq";
import { redis } from "../config/redis";
import { DEFAULT_QUEUE_JOB_OPTIONS, PAYROLL_JOBS, QUEUE_NAMES } from "../config/constants";

export interface ProcessPayrollJobData {
  job: typeof PAYROLL_JOBS.PROCESS_RUN;
  payrollId: string;
  companyId: string;
  employeeIds?: string[];
}

export const payrollQueue = new Queue<ProcessPayrollJobData>(QUEUE_NAMES.PAYROLL, {
  connection: redis,
});

export async function enqueuePayrollRun(data: ProcessPayrollJobData) {
  await payrollQueue.add(data.job, data, DEFAULT_QUEUE_JOB_OPTIONS);
}
