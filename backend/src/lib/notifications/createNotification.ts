import type { Types } from "mongoose";
import { NotificationModel, type NotificationType } from "../../models/notification.model";
import { logger } from "../logger";

interface CreateNotificationInput {
  companyId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await NotificationModel.create(input);
  } catch (err) {
    // Notifications are non-critical — log and swallow so they never break the main flow.
    logger.error("Failed to create notification", { error: (err as Error).message, type: input.type });
  }
}
