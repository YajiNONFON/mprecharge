import { NotificationType } from "../../../generated/prisma/enums";
import { prisma } from "../../infrastructure/database/prisma";

export const findNotificationsByUserId = async (userId: string) => {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
    include: {
      service: { select: { name: true, displayName: true } },
    },
  });
};

export const findNotificationById = async (id: string) => {
  return prisma.notification.findUnique({ where: { id } });
};

export const markNotificationAsRead = async (id: string) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const createNotification = async (data: {
  userId: string;
  serviceId: string;
  title: string;
  message: string;
  type: NotificationType;
}) => {
  return prisma.notification.create({ data });
};
