import { Router } from "express";
import * as OperationController from "./operation.controller";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  authenticateUser,
  protectedRoute,
} from "../../shared/middlewares/auth.middleware";
import { DepositDto, WithdrawalDto } from "./operation.dto";

export const operationRouter = Router();

operationRouter.use(authenticateUser, protectedRoute);

/**
 * @swagger
 * tags:
 *   name: Operations
 *   description: Deposit and withdrawal operations
 */

/**
 * @swagger
 * /operations/deposit:
 *   post:
 *     summary: Initiate a deposit
 *     tags: [Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - amount
 *               - networkType
 *               - paymentNumber
 *               - accountId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: "1xBet"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               networkType:
 *                 type: string
 *                 enum:
 *                   - mtn
 *                   - moov
 *                   - celtiis_bj
 *                   - moov_tg
 *                   - moov_bf
 *                   - orange_bf
 *                   - orange_sn
 *                   - mtn_ci
 *                   - moov_ci
 *                   - orange_ci
 *                 example: mtn
 *               paymentNumber:
 *                 type: string
 *                 example: "22997000000"
 *               accountId:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       201:
 *         description: Deposit initiated successfully
 *       400:
 *         description: Invalid data or payment failed
 *       404:
 *         description: Service not found
 */
operationRouter.post(
  "/deposit",
  validate(DepositDto),
  OperationController.createDeposit,
);

/**
 * @swagger
 * /operations/withdrawal:
 *   post:
 *     summary: Initiate a withdrawal
 *     tags: [Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - amount
 *               - networkType
 *               - receiverNumber
 *               - receiverFullName
 *               - accountId
 *             properties:
 *               serviceId:
 *                 type: string
 *                 example: "1xBet"
 *               amount:
 *                 type: number
 *                 example: 5000
 *               networkType:
 *                 type: string
 *                 enum:
 *                   - mtn
 *                   - moov
 *                   - celtiis_bj
 *                   - moov_tg
 *                   - moov_bf
 *                   - orange_bf
 *                   - orange_sn
 *                   - mtn_ci
 *                   - moov_ci
 *                   - orange_ci
 *                 example: mtn
 *               receiverNumber:
 *                 type: string
 *                 example: "22997000000"
 *               receiverFullName:
 *                 type: string
 *                 example: "Yaji NONFON"
 *               withdrawalCode:
 *                 type: string
 *                 example: "1234"
 *               accountId:
 *                 type: string
 *                 example: "123456789"
 *     responses:
 *       201:
 *         description: Withdrawal registered successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: Service not found
 */
operationRouter.post(
  "/withdrawal",
  validate(WithdrawalDto),
  OperationController.createWithdrawal,
);
