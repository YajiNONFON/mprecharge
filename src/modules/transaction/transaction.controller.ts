import { Request, Response, NextFunction } from "express";
import * as TransactionService from "./transaction.service";
import { TransactionsStatus } from "../../../generated/prisma/enums";

// GET MY TRANSACTIONS

export const getMyTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const transactions = await TransactionService.getMyTransactions(userId);
    return res.status(200).json(transactions);
  } catch (error) {
    next(error);
  }
};

// GET MY TRANSACTION BY ID

export const getMyTransactionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const transactionId = req.params.id as string;
    const transaction = await TransactionService.getMyTransactionById(
      transactionId,
      userId,
    );
    return res.status(200).json(transaction);
  } catch (error) {
    next(error);
  }
};

// GET ALL TRANSACTIONS (admin)

export const getAllTransactions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const type = (req.query.type as string) ?? undefined;
    const service = (req.query.service as string) ?? undefined;
    const status = (req.query.status as string) ?? undefined;

    const result = await TransactionService.getAllTransactions({
      page,
      limit,
      type,
      service,
      status,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// UPDATE TRANSACTION STATUS (admin)

export const updateTransactionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    if (!Object.values(TransactionsStatus).includes(status)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const updated = await TransactionService.updateTransactionStatus(
      id,
      status,
    );

    return res.status(200).json({
      message: "Statut mis à jour avec succès.",
      transaction: updated,
    });
  } catch (error) {
    next(error);
  }
};
