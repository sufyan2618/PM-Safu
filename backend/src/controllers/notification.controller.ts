import type { Request, Response } from "express";
import { NotificationModel } from "../models/notification.model";
import { asyncHandler } from "../utils/async-handler";
import { ApiError } from "../utils/apiError";
import { sendSuccess } from "../utils/apiResponse";

export const listNotifications = asyncHandler(async (req: Request, res: Response) => {
  const companyId = req.companyId!;
  const limit = Math.min(Number(req.query.limit) || 30, 100);

  const [notifications, unreadCount] = await Promise.all([
    NotificationModel.find({ companyId }).sort({ createdAt: -1 }).limit(limit).lean(),
    NotificationModel.countDocuments({ companyId, isRead: false }),
  ]);

  return sendSuccess(res, { data: { notifications, unreadCount } });
});

export const markAllRead = asyncHandler(async (req: Request, res: Response) => {
  await NotificationModel.updateMany({ companyId: req.companyId, isRead: false }, { $set: { isRead: true } });
  return sendSuccess(res, { message: "All notifications marked as read" });
});

export const markOneRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await NotificationModel.findOne({
    _id: req.params.id,
    companyId: req.companyId,
  });
  if (!notification) throw ApiError.notFound("Notification not found");

  notification.isRead = true;
  await notification.save();
  return sendSuccess(res, { data: notification });
});
