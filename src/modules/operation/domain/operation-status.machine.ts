// TRANSITIONS AUTORISÉES

import { TransactionsStatus } from "../../../../generated/prisma/enums";

const ALLOWED_TRANSITIONS: Record<TransactionsStatus, TransactionsStatus[]> = {
  PENDING: [TransactionsStatus.SUCCESS, TransactionsStatus.FAILED],
  SUCCESS: [],
  FAILED: [],
};

// VÉRIFICATION TRANSITION

export const canTransition = (
  from: TransactionsStatus,
  to: TransactionsStatus,
): boolean => {
  return ALLOWED_TRANSITIONS[from].includes(to);
};

export const isTerminalStatus = (status: TransactionsStatus): boolean => {
  return (
    status === TransactionsStatus.SUCCESS ||
    status === TransactionsStatus.FAILED
  );
};

export const isPending = (status: TransactionsStatus): boolean => {
  return status === TransactionsStatus.PENDING;
};

// TRANSITION AVEC GUARD

export interface TransitionResult {
  allowed: boolean;
  reason?: string;
}

export const transition = (
  from: TransactionsStatus,
  to: TransactionsStatus,
): TransitionResult => {
  if (isTerminalStatus(from)) {
    return {
      allowed: false,
      reason: `Transaction already in terminal status: ${from}`,
    };
  }

  if (!canTransition(from, to)) {
    return {
      allowed: false,
      reason: `Transition from ${from} to ${to} is not allowed`,
    };
  }

  return { allowed: true };
};
