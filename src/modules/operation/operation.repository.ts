import {
  TransactionsStatus,
  TransactionsType,
} from "../../../generated/prisma/enums";
import { prisma } from "../../infrastructure/database/prisma";

// SERVICE

export const findServiceById = async (serviceId: string) => {
  return prisma.service.findFirst({
    where: {
      OR: [{ id: serviceId }, { name: serviceId }, { displayName: serviceId }],
      isActive: true,
    },
  });
};

// USER

export const findUserWithProfile = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      profile: {
        select: {
          oneXbetId: true,
          platformAccountId: true,
          activeServiceId: true,
        },
      },
    },
  });
};

// TRANSACTION

export const createTransaction = async (data: {
  userId: string;
  serviceId: string;
  type: TransactionsType;
  amount: number;
  netAmount?: number;
  fees?: number;
  status: TransactionsStatus;
  networkType: string;
  paymentNumber?: string;
  receiverNumber?: string;
  accountId: string;
  clientFullName: string;
  withdrawalCode?: string;
  transpublicId: string;
}) => {
  return prisma.transaction.create({ data });
};

export const updateTransactionProviderRef = async (
  transactionId: string,
  providerRef: string,
) => {
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { providerRef, updated_at: new Date() },
  });
};

export const updateTransactionStatus = async (
  transactionId: string,
  status: TransactionsStatus,
) => {
  return prisma.transaction.update({
    where: { id: transactionId },
    data: { status, updated_at: new Date() },
  });
};

export const claimTransaction = async (transactionId: string) => {
  const result = await prisma.transaction.updateMany({
    where: { id: transactionId, status: TransactionsStatus.PENDING },
    data: { status: TransactionsStatus.SUCCESS, updated_at: new Date() },
  });
  return result.count > 0;
};

export const findTransactionById = async (transactionId: string) => {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
  });
};

export const findTransactionStatus = async (transactionId: string) => {
  return prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { status: true },
  });
};

export const findTransactionNumberForToday = async (
  transactionId: string,
): Promise<number> => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { created_at: true },
  });

  if (!transaction) return 0;

  const startOfDay = new Date(transaction.created_at);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(transaction.created_at);
  endOfDay.setHours(23, 59, 59, 999);

  const count = await prisma.transaction.count({
    where: {
      created_at: {
        gte: startOfDay,
        lte: endOfDay,
      },
      id: { lte: transactionId },
    },
  });

  return count;
};
