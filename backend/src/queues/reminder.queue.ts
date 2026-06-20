import { Queue } from "bullmq";
import { redis } from "../config/redis";
import { QUEUE_NAMES, REMINDER_JOBS } from "../config/constants";

export const reminderQueue = new Queue(QUEUE_NAMES.REMINDER, { connection: redis });

/**
 * Registers the daily repeatable jobs. Idempotent — BullMQ dedupes repeatables
 * by name + pattern, so calling this on every boot is safe.
 */
export async function registerReminderSchedules() {
  await reminderQueue.add(
    REMINDER_JOBS.CHECK_OVERDUE,
    {},
    { repeat: { pattern: "0 6 * * *" }, removeOnComplete: true, removeOnFail: 50 },
  );
  await reminderQueue.add(
    REMINDER_JOBS.DUE_SOON,
    {},
    { repeat: { pattern: "0 7 * * *" }, removeOnComplete: true, removeOnFail: 50 },
  );
}
