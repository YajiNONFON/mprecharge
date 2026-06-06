import { Router } from "express";
import * as NotificationController from "./notification.controller";
import {
  authenticateUser,
  protectedRoute,
} from "../../shared/middlewares/auth.middleware";

export const notificationRouter = Router();

notificationRouter.use(authenticateUser, protectedRoute);

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notifications management
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get current user notifications
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
notificationRouter.get("/", NotificationController.getNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
notificationRouter.patch(
  "/:id/read",
  NotificationController.markNotificationAsRead,
);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
notificationRouter.patch(
  "/read-all",
  NotificationController.markAllNotificationsAsRead,
);
