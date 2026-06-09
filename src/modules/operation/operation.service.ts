import * as OperationRepository from "./operation.repository";
import { startPolling } from "./domain/polling.service";
import { calculateFees, formatPhoneNumber } from "./domain/operation.entity";
import type { DepositDtoType, WithdrawalDtoType } from "./operation.dto";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../../shared/errors/http-errors";
import { generateTransUniquePublicId } from "../../shared/utils/generatePublicId";
import {
  PipelineStep,
  PipelineStepStatus,
  TransactionsStatus,
  TransactionsType,
} from "../../../generated/prisma/enums";
import { feexpayClient } from "../../shared/utils/feexpayClient";
import { notificationService } from "../../shared/services/notification.service";
import { sendWithdrawalRequestMessage } from "../../shared/services/telegram.service";
import { mocashClient } from "../../shared/utils/mocashClient";
import { createTransactionLog } from "../transaction/domain/transaction-log.repository";

// DEPOSIT

export const createDeposit = async (
  userId: string,
  data: DepositDtoType,
  ipAddress?: string,
) => {
  const service = await OperationRepository.findServiceById(data.serviceId);
  if (!service) throw new NotFoundException("Service introuvable.");

  const user = await OperationRepository.findUserWithProfile(userId);
  if (!user) throw new UnauthorizedException("Utilisateur introuvable.");

  const clientFullName = `${user.first_name} ${user.last_name}`.trim();

  const { formattedPhone, error } = formatPhoneNumber(
    data.paymentNumber,
    data.networkType,
  );
  if (error) throw new BadRequestException(error);

  const { desiredAmount, netAmount, fees } = calculateFees(data.amount);

  const transpublicId = await generateTransUniquePublicId("TXR");

  const transaction = await OperationRepository.createTransaction({
    userId,
    serviceId: service.id,
    type: TransactionsType.DEPOSIT,
    amount: desiredAmount,
    netAmount,
    fees,
    status: TransactionsStatus.PENDING,
    networkType: data.networkType.toUpperCase(),
    paymentNumber: formattedPhone,
    accountId: data.accountId,
    clientFullName,
    transpublicId,
  });

  // ── Log INITIATED ──
  await createTransactionLog({
    transactionId: transaction.id,
    step: PipelineStep.INITIATED,
    status: PipelineStepStatus.SUCCESS,
    message: `Transaction ${transpublicId} créée`,
    metadata: { amount: desiredAmount, network: data.networkType },
  });

  try {
    const feexpayResponse = await feexpayClient.requestToPay({
      amount: netAmount,
      phoneNumber: formattedPhone,
      network: data.networkType.toLowerCase() as "mtn" | "moov",
      firstName: user.first_name,
      lastName: user.last_name,
      email: process.env.FEEXPAY_EMAIL!,
    });

    await OperationRepository.updateTransactionProviderRef(
      transaction.id,
      feexpayResponse.reference,
    );

    // ── Échec immédiat gateway ──
    if (feexpayResponse.skipPolling && feexpayResponse.status === "FAILED") {
      await OperationRepository.updateTransactionStatus(
        transaction.id,
        TransactionsStatus.FAILED,
      );

      await createTransactionLog({
        transactionId: transaction.id,
        step: PipelineStep.GATEWAY_PENDING,
        status: PipelineStepStatus.FAILED,
        message: `${data.networkType} rejeté dès l'initiation`,
        metadata: { reference: feexpayResponse.reference },
      });

      await createTransactionLog({
        transactionId: transaction.id,
        step: PipelineStep.COMPLETED,
        status: PipelineStepStatus.FAILED,
        message: "Transaction échouée à l'initiation gateway",
      });

      throw new BadRequestException(
        "Paiement échoué. Vérifiez votre solde ou réessayez.",
      );
    }

    // ── Log GATEWAY_PENDING ──
    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.GATEWAY_PENDING,
      status: PipelineStepStatus.SUCCESS,
      message: `Réseau contacté — en attente confirmation USSD`,
      metadata: {
        reference: feexpayResponse.reference,
        skipPolling: feexpayResponse.skipPolling,
      },
    });

    if (!feexpayResponse.skipPolling) {
      startPolling(
        {
          transactionId: transaction.id,
          gatewayRef: feexpayResponse.reference,
          serviceName: service.name,
          accountId: data.accountId,
          userId,
          serviceId: service.id,
          desiredAmount,
          clientFullName,
          phoneNumber: formattedPhone,
          delaySeconds: 0,
        },
        feexpayClient,
      );
    }

    await notificationService.sendNotificationOnly(
      userId,
      "Paiement initié",
      `Un paiement de ${desiredAmount} FCFA a été initié. Veuillez valider la notification sur votre téléphone.`,
      "INFO",
      service.id,
    );

    return {
      id: transaction.id,
      transpublicId: transaction.transpublicId,
      gatewayReference: feexpayResponse.reference,
      amount: desiredAmount,
      status: transaction.status,
    };
  } catch (feexpayError: any) {
    if (feexpayError.statusCode) throw feexpayError;

    await OperationRepository.updateTransactionStatus(
      transaction.id,
      TransactionsStatus.FAILED,
    );

    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.GATEWAY_PENDING,
      status: PipelineStepStatus.FAILED,
      message: feexpayError.message,
    });

    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.COMPLETED,
      status: PipelineStepStatus.FAILED,
      message: "Erreur gateway — transaction échouée",
    });

    throw new BadRequestException(
      `Impossible d'initier le paiement: ${feexpayError.message}`,
    );
  }
};

// WITHDRAWAL

export const createWithdrawal = async (
  userId: string,
  data: WithdrawalDtoType,
) => {
  const service = await OperationRepository.findServiceById(data.serviceId);
  if (!service) throw new NotFoundException("Service introuvable.");

  const user = await OperationRepository.findUserWithProfile(userId);
  if (!user) throw new UnauthorizedException("Utilisateur introuvable.");

  const transpublicId = await generateTransUniquePublicId("TXR");

  const transaction = await OperationRepository.createTransaction({
    userId,
    serviceId: service.id,
    type: TransactionsType.WITHDRAWAL,
    amount: data.amount,
    status: TransactionsStatus.PENDING,
    networkType: data.networkType,
    receiverNumber: data.receiverNumber,
    accountId: data.accountId,
    clientFullName: data.receiverFullName,
    withdrawalCode: data.withdrawalCode,
    transpublicId,
  });

  if (!transaction.transpublicId) {
    throw new BadRequestException(
      "Erreur lors de la création de la transaction.",
    );
  }

  // ── Log INITIATED ──
  await createTransactionLog({
    transactionId: transaction.id,
    step: PipelineStep.INITIATED,
    status: PipelineStepStatus.SUCCESS,
    message: `Retrait ${transpublicId} créé`,
    metadata: { amount: data.amount, network: data.networkType },
  });

  if (!data.withdrawalCode) {
    await OperationRepository.updateTransactionStatus(
      transaction.id,
      TransactionsStatus.FAILED,
    );
    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.MOCASH_DEBIT,
      status: PipelineStepStatus.FAILED,
      message: "Code de retrait manquant",
    });
    throw new BadRequestException(
      "Le code de retrait est obligatoire pour initier le prélèvement.",
    );
  }

  try {
    const mocashResponse = await mocashClient.payoutFromAccount({
      userId: data.accountId,
      code: data.withdrawalCode,
      language: "fr",
    });

    if (!mocashResponse.success) {
      await OperationRepository.updateTransactionStatus(
        transaction.id,
        TransactionsStatus.FAILED,
      );

      await createTransactionLog({
        transactionId: transaction.id,
        step: PipelineStep.MOCASH_DEBIT,
        status: PipelineStepStatus.FAILED,
        message: mocashResponse.message || "Échec prélèvement MoCash",
      });

      await createTransactionLog({
        transactionId: transaction.id,
        step: PipelineStep.COMPLETED,
        status: PipelineStepStatus.FAILED,
        message: "Transaction échouée — prélèvement MoCash rejeté",
      });

      throw new BadRequestException(
        mocashResponse.message || "Échec du prélèvement MoCash.",
      );
    }

    // ── Log MOCASH_DEBIT ──
    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.MOCASH_DEBIT,
      status: PipelineStepStatus.SUCCESS,
      message: `Prélèvement MoCash réussi — ${mocashResponse.summa} FCFA`,
      metadata: { summa: mocashResponse.summa },
    });

    // ── Log ADMIN_PROCESS ──
    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.ADMIN_PROCESS,
      status: PipelineStepStatus.PENDING,
      message: "En attente de traitement admin",
    });

    console.log(
      `✅ [WITHDRAWAL] Payout MoCash réussi — userId: ${data.accountId}, montant: ${mocashResponse.summa} FCFA`,
    );
  } catch (mocashError: any) {
    if (mocashError.statusCode) throw mocashError;

    await OperationRepository.updateTransactionStatus(
      transaction.id,
      TransactionsStatus.FAILED,
    );

    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.MOCASH_DEBIT,
      status: PipelineStepStatus.FAILED,
      message: mocashError.message,
    });

    await createTransactionLog({
      transactionId: transaction.id,
      step: PipelineStep.COMPLETED,
      status: PipelineStepStatus.FAILED,
      message: "Erreur MoCash — transaction échouée",
    });

    throw new BadRequestException(
      `Impossible d'initier le prélèvement: ${mocashError.message}`,
    );
  }

  const transactionNumber =
    await OperationRepository.findTransactionNumberForToday(transaction.id);

  await sendWithdrawalRequestMessage({
    transactionNumber,
    transpublicId: transaction.transpublicId,
    amount: data.amount,
    beneficiaryName: data.receiverFullName,
    phoneNumber: data.receiverNumber,
    networkType: data.networkType,
    withdrawalCode: data.withdrawalCode,
    accountId: data.accountId,
    service: service.displayName,
  });

  await notificationService.sendNotificationOnly(
    userId,
    "Retrait enregistré ✅",
    `Votre demande de retrait de ${data.amount} XOF depuis ${service.displayName} a bien été reçue. Le prélèvement a été effectué sur votre compte, votre paiement est en cours de traitement.`,
    "INFO",
    service.id,
  );

  return {
    id: transaction.id,
    transpublicId: transaction.transpublicId,
    amount: data.amount,
    status: transaction.status,
  };
};
