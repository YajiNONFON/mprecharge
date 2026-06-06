import { Router } from "express";
import * as AdminController from "./admin.controller";
import {
  authenticateUser,
  adminOnly,
} from "../../shared/middlewares/auth.middleware";

export const adminRouter = Router();

adminRouter.use(authenticateUser, adminOnly);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin dashboard and statistics
 */

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: day
 *         description: Time period for statistics
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 150
 *                 activeUsers:
 *                   type: integer
 *                   example: 120
 *                 totalAdmins:
 *                   type: integer
 *                   example: 3
 *                 pendingTransaction:
 *                   type: integer
 *                   example: 5
 *                 totalDeposits:
 *                   type: number
 *                   example: 500000
 *                 totalPendingAmount:
 *                   type: number
 *                   example: 25000
 *                 totalWithdrawals:
 *                   type: number
 *                   example: 150000
 *       403:
 *         description: Forbidden
 */
adminRouter.get("/stats", AdminController.getAdminStats);
