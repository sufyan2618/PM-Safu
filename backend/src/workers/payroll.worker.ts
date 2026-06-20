import { Worker } from "bullmq";
import { redis } from "../config/redis";
import { QUEUE_NAMES } from "../config/constants";
import { logger } from "../lib/logger";
import { processPayrollRun } from "../lib/payroll/processPayrollRun";
import type { ProcessPayrollJobData } from "../queues/payroll.queue";

export const payrollWorker = new Worker<ProcessPayrollJobData>(
  QUEUE_NAMES.PAYROLL,
  async (job) => {
    await processPayrollRun({
      payrollId: job.data.payrollId,
      companyId: job.data.companyId,
      employeeIds: job.data.employeeIds,
    });
  },
  { connection: redis, concurrency: 1 },
);

payrollWorker.on("completed", (job) => logger.info(`Payroll job completed: ${job.id}`));
payrollWorker.on("failed", (job, err) =>
  logger.error(`Payroll job failed: ${job?.id} - ${err.message}`),
);
