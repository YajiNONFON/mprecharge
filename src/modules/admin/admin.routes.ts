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

/**
 * @swagger
 * /admin/stats/chart:
 *   get:
 *     summary: Get transaction chart data
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [day, week, month, year]
 *           default: week
 *     responses:
 *       200:
 *         description: Chart data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   label:
 *                     type: string
 *                     example: lun.
 *                   deposits:
 *                     type: number
 *                     example: 15000
 *                   withdrawals:
 *                     type: number
 *                     example: 8000
 */
adminRouter.get("/stats/chart", AdminController.getChartData);

/**
 * @swagger
 * /admin/stats/peak-hours:
 *   get:
 *     summary: Get peak transaction hours (last 30 days)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Peak hours retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   slot:
 *                     type: string
 *                     example: 08h-10h
 *                   count:
 *                     type: integer
 *                     example: 42
 */
adminRouter.get("/stats/peak-hours", AdminController.getPeakHours);
