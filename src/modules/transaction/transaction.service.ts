import * as TransactionRepository from "./transaction.repository";
import type { GetAllTransactionsParams } from "./transaction.repository";
import { transition } from "../operation/domain/operation-status.machine";
import {
  BadRequestException,
  NotFoundException,
} from "../../shared/errors/http-errors";
import { TransactionsStatus } from "../../../generated/prisma/enums";

// GET MY TRANSACTIONS

export const getMyTransactions = async (userId: string) => {
  const transactions =
    await TransactionRepository.findTransactionsByUserId(userId);

  if (!transactions || transactions.length === 0) {
    throw new NotFoundException("Aucune transaction trouvée.");
  }

  return transactions;
};

// GET MY TRANSACTION BY ID

export const getMyTransactionById = async (
  transactionId: string,
  userId: string,
) => {
  const transaction = await TransactionRepository.findTransactionByIdAndUserId(
    transactionId,
    userId,
  );

  if (!transaction) {
    throw new NotFoundException("Transaction non trouvée.");
  }

  return transaction;
};

// GET ALL TRANSACTIONS (admin)

export const getAllTransactions = async (params: GetAllTransactionsParams) => {
  const { transactions, total, totalPages, currentPage } =
    await TransactionRepository.findAllTransactions(params);

  const formatted = transactions.map((t: any) => ({
    id: t.id,
    transpublicId: t.transpublicId,
    name: `${t.first_name} ${t.last_name}`.trim(),
    amount: t.amount,
    netAmount: t.net_amount,
    fees: t.fees,
    type: t.type,
    status: t.status,
    networkType: t.network_type,
    paymentNumber: t.payment_number,
    accountId: t.account_id,
    clientFullName: t.client_full_name,
    providerRef: t.provider_ref,
    service: {
      name: t.service_name,
      displayName: t.service_display_name,
    },
    created_at: t.created_at,
    updated_at: t.updated_at,
  }));

  return { transactions: formatted, total, totalPages, currentPage };
};

// UPDATE TRANSACTION STATUS (admin)

export const updateTransactionStatus = async (
  id: string,
  status: TransactionsStatus,
) => {
  const transaction = await TransactionRepository.findTransactionById(id);

  if (!transaction) {
    throw new NotFoundException("Transaction introuvable.");
  }

  const result = transition(transaction.status, status);

  if (!result.allowed) {
    throw new BadRequestException(
      result.reason ?? "Transition de statut invalide.",
    );
  }

  return TransactionRepository.updateTransactionStatus(id, status);
};
