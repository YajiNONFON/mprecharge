import {
  PipelineStep,
  PipelineStepStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../../infrastructure/database/prisma";

// TYPES

export interface CreateLogParams {
  transactionId: string;
  step: PipelineStep;
  status: PipelineStepStatus;
  message?: string;
  metadata?: Record<string, unknown>;
}

// WRITE

export const createTransactionLog = async (
  params: CreateLogParams,
): Promise<void> => {
  await prisma.transactionLog.create({
    data: {
      transactionId: params.transactionId,
      step: params.step,
      status: params.status,
      message: params.message ?? null,
      metadata: params.metadata ? (params.metadata as any) : undefined,
    },
  });
};

// READ — pipeline complet d'une transaction

export const findPipelineByTransactionId = async (transactionId: string) => {
  return prisma.transactionLog.findMany({
    where: { transactionId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      step: true,
      status: true,
      message: true,
      metadata: true,
      createdAt: true,
    },
  });
};
