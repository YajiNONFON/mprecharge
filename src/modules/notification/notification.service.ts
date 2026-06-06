import { NotificationType } from "../../../generated/prisma/enums";
import { NotFoundException } from "../../shared/errors/http-errors";
import * as NotificationRepository from "./notification.repository";

// GET USER NOTIFICATIONS

export const getUserNotifications = async (userId: string) => {
  return NotificationRepository.findNotificationsByUserId(userId);
};

// MARK AS READ

export const markAsRead = async (id: string) => {
  const notif = await NotificationRepository.findNotificationById(id);

  if (!notif) {
    throw new NotFoundException("Notification introuvable.");
  }

  return NotificationRepository.markNotificationAsRead(id);
};

// MARK ALL AS READ

export const markAllAsRead = async (userId: string) => {
  return NotificationRepository.markAllNotificationsAsRead(userId);
};

// SEND NOTIFICATION (appelé par operation.service)

export const sendNotificationOnly = async (
  userId: string,
  title: string,
  message: string,
  type: string,
  serviceId: string,
) => {
  return NotificationRepository.createNotification({
    userId,
    serviceId,
    title,
    message,
    type: type as NotificationType,
  });
};
