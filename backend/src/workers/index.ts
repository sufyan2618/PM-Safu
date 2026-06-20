import { connectDatabase } from "../config/db";
import { logger } from "../lib/logger";
import { registerReminderSchedules } from "../queues/reminder.queue";
import { emailWorker } from "./email.worker";
import { pdfWorker } from "./pdf.worker";
import { payrollWorker } from "./payroll.worker";
import { reminderWorker } from "./reminder.worker";

async function bootstrapWorkers() {
  await connectDatabase();
  await registerReminderSchedules();
  logger.info("All BullMQ workers started (email, pdf, payroll, reminder)");
}

bootstrapWorkers().catch((error) => {
  logger.error("Failed to start workers", { error: (error as Error).message });
  process.exit(1);
});

async function shutdown() {
  logger.info("Shutting down workers...");
  await Promise.allSettled([
    emailWorker.close(),
    pdfWorker.close(),
    payrollWorker.close(),
    reminderWorker.close(),
  ]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
