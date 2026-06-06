import { Request, Response, NextFunction } from "express";
import * as NotificationService from "./notification.service";

export const getNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const notifications =
      await NotificationService.getUserNotifications(userId);
    return res.status(200).json({ notifications });
  } catch (error) {
    next(error);
  }
};

export const markNotificationAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const notif = await NotificationService.markAsRead(id);
    return res.status(200).json(notif);
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    await NotificationService.markAllAsRead(userId);
    return res.status(200).json({
      message: "Toutes les notifications marquées comme lues.",
    });
  } catch (error) {
    next(error);
  }
};
