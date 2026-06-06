import { Request, Response, NextFunction } from "express";
import * as OperationService from "./operation.service";
import type { DepositDtoType, WithdrawalDtoType } from "./operation.dto";

// ─────────────────────────────────────────
// DEPOSIT
// ─────────────────────────────────────────

export const createDeposit = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as DepositDtoType;
    const ipAddress = req.ip;

    const result = await OperationService.createDeposit(
      userId,
      body,
      ipAddress,
    );

    return res.status(201).json({
      message:
        "Paiement initié avec succès. Veuillez valider la notification sur votre téléphone.",
      transaction: result,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// WITHDRAWAL
// ─────────────────────────────────────────

export const createWithdrawal = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as WithdrawalDtoType;

    const result = await OperationService.createWithdrawal(userId, body);

    return res.status(201).json({
      message: "Retrait enregistré avec succès.",
      transaction: result,
    });
  } catch (error) {
    next(error);
  }
};
