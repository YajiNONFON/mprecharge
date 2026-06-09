import * as TransactionRepository from "./transaction.repository";
import type { GetAllTransactionsParams } from "./transaction.repository";
import { transition } from "../operation/domain/operation-status.machine";
import {
  BadRequestException,
  NotFoundException,
} from "../../shared/errors/http-errors";
import {
  PipelineStep,
  PipelineStepStatus,
  TransactionsStatus,
} from "../../../generated/prisma/enums";
import {
  createTransactionLog,
  findPipelineByTransactionId,
} from "./domain/transaction-log.repository";

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

/*export const updateTransactionStatus = async (
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
};*/

export const updateTransactionStatus = async (
  id: string,
  status: TransactionsStatus,
  adminId?: string,
) => {
  const transaction = await TransactionRepository.findTransactionById(id);
  if (!transaction) throw new NotFoundException("Transaction introuvable.");

  const result = transition(transaction.status, status);
  if (!result.allowed) {
    throw new BadRequestException(
      result.reason ?? "Transition de statut invalide.",
    );
  }

  const updated = await TransactionRepository.updateTransactionStatus(
    id,
    status,
  );

  // ── Log ADMIN_PROCESS résolution ──
  await createTransactionLog({
    transactionId: id,
    step: PipelineStep.ADMIN_PROCESS,
    status:
      status === TransactionsStatus.SUCCESS
        ? PipelineStepStatus.SUCCESS
        : PipelineStepStatus.FAILED,
    message:
      status === TransactionsStatus.SUCCESS
        ? "Admin a validé la transaction"
        : "Admin a rejeté la transaction",
    metadata: adminId ? { adminId } : undefined,
  });

  // ── Log COMPLETED ──
  await createTransactionLog({
    transactionId: id,
    step: PipelineStep.COMPLETED,
    status:
      status === TransactionsStatus.SUCCESS
        ? PipelineStepStatus.SUCCESS
        : PipelineStepStatus.FAILED,
    message:
      status === TransactionsStatus.SUCCESS
        ? "Transaction terminée avec succès"
        : "Transaction échouée",
  });

  return updated;
};

// GET PIPELINE (admin)
export const getTransactionPipeline = async (transactionId: string) => {
  const transaction =
    await TransactionRepository.findTransactionById(transactionId);
  if (!transaction) throw new NotFoundException("Transaction introuvable.");

  const logs = await findPipelineByTransactionId(transactionId);

  // Ordre canonique des étapes selon le type
  const depositSteps: PipelineStep[] = [
    PipelineStep.INITIATED,
    PipelineStep.GATEWAY_PENDING,
    PipelineStep.GATEWAY_CONFIRMED,
    PipelineStep.MOCASH_CREDIT,
    PipelineStep.COMPLETED,
  ];

  const withdrawalSteps: PipelineStep[] = [
    PipelineStep.INITIATED,
    PipelineStep.MOCASH_DEBIT,
    PipelineStep.ADMIN_PROCESS,
    PipelineStep.COMPLETED,
  ];

  const isWithdrawal = transaction.type === "WITHDRAWAL";
  const steps = isWithdrawal ? withdrawalSteps : depositSteps;

  // Map les logs sur les étapes canoniques
  const pipeline = steps.map((step) => {
    const log = logs.find((l) => l.step === step);
    return {
      step,
      status: log?.status ?? "NOT_REACHED",
      message: log?.message ?? null,
      metadata: log?.metadata ?? null,
      timestamp: log?.createdAt ?? null,
    };
  });

  return {
    transactionId,
    transpublicId: transaction.transpublicId,
    type: transaction.type,
    currentStatus: transaction.status,
    pipeline,
  };
};
