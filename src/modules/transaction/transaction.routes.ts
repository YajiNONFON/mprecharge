import { Router } from "express";
import * as TransactionController from "./transaction.controller";
import {
  authenticateUser,
  protectedRoute,
  adminOnly,
  supAdminOnly,
} from "../../shared/middlewares/auth.middleware";

export const transactionRouter = Router();

transactionRouter.use(authenticateUser, protectedRoute);

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Transaction history and management
 */

/**
 * @swagger
 * /transactions:
 *   get:
 *     summary: Get current user transactions
 *     tags: [Transactions]
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       404:
 *         description: No transactions found
 */
transactionRouter.get("/", TransactionController.getMyTransactions);

/**
 * @swagger
 * /transactions/{id}:
 *   get:
 *     summary: Get a transaction by ID
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 */
transactionRouter.get("/:id", TransactionController.getMyTransactionById);

/**
 * @swagger
 * /transactions/admin/all:
 *   get:
 *     summary: Get all transactions with filters (admin only)
 *     tags: [Transactions]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [DEPOSIT, WITHDRAWAL, tous]
 *           example: DEPOSIT
 *       - in: query
 *         name: service
 *         schema:
 *           type: string
 *           example: 1xBet
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED, tous]
 *           example: PENDING
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       403:
 *         description: Forbidden
 */
transactionRouter.get(
  "/admin/all",
  adminOnly,
  TransactionController.getAllTransactions,
);

/**
 * @swagger
 * /transactions/admin/{id}/status:
 *   patch:
 *     summary: Update a transaction status (admin only)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *                 example: SUCCESS
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status or transition not allowed
 *       404:
 *         description: Transaction not found
 *       403:
 *         description: Forbidden
 */
transactionRouter.patch(
  "/admin/:id/status",
  supAdminOnly,
  TransactionController.updateTransactionStatus,
);

/**
 * @swagger
 * /transactions/admin/{id}/pipeline:
 *   get:
 *     summary: Get transaction pipeline logs (admin only)
 *     tags: [Transactions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Pipeline retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactionId:
 *                   type: string
 *                 transpublicId:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [DEPOSIT, WITHDRAWAL]
 *                 currentStatus:
 *                   type: string
 *                   enum: [PENDING, SUCCESS, FAILED]
 *                 pipeline:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       step:
 *                         type: string
 *                       status:
 *                         type: string
 *                       message:
 *                         type: string
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       404:
 *         description: Transaction not found
 *       403:
 *         description: Forbidden
 */
transactionRouter.get(
  "/admin/:id/pipeline",
  adminOnly,
  TransactionController.getTransactionPipeline,
);
