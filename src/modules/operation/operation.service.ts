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
  TransactionsStatus,
  TransactionsType,
} from "../../../generated/prisma/enums";
import { feexpayClient } from "../../shared/utils/feexpayClient";
import { notificationService } from "../../shared/services/notification.service";
import { sendWithdrawalRequestMessage } from "../../shared/services/telegram.service";

// ─────────────────────────────────────────
// DEPOSIT
// ─────────────────────────────────────────

export const createDeposit = async (
  userId: string,
  data: DepositDtoType,
  ipAddress?: string,
) => {
  // Récupération service
  const service = await OperationRepository.findServiceById(data.serviceId);
  if (!service) {
    throw new NotFoundException("Service introuvable.");
  }

  // Récupération user
  const user = await OperationRepository.findUserWithProfile(userId);
  if (!user) {
    throw new UnauthorizedException("Utilisateur introuvable.");
  }

  const clientFullName = `${user.first_name} ${user.last_name}`.trim();

  // Formatage numéro
  const { formattedPhone, error } = formatPhoneNumber(
    data.paymentNumber,
    data.networkType,
  );

  if (error) {
    throw new BadRequestException(error);
  }

  // Calcul frais
  const { desiredAmount, netAmount, fees } = calculateFees(data.amount);

  // Création transaction PENDING
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

  // Initiation paiement FeeXpay
  try {
    const feexpayResponse = await feexpayClient.requestToPay({
      amount: netAmount,
      phoneNumber: formattedPhone,
      network: data.networkType.toLowerCase() as "mtn" | "moov",
      firstName: user.first_name,
      lastName: user.last_name,
      email: process.env.FEEXPAY_EMAIL!,
    });

    // Mise à jour providerRef
    await OperationRepository.updateTransactionProviderRef(
      transaction.id,
      feexpayResponse.reference,
    );

    // Échec immédiat FeeXpay
    if (feexpayResponse.skipPolling && feexpayResponse.status === "FAILED") {
      await OperationRepository.updateTransactionStatus(
        transaction.id,
        TransactionsStatus.FAILED,
      );

      console.log(`❌ [INIT] ${data.networkType} échoué dès l'initiation`);

      throw new BadRequestException(
        "Paiement échoué. Vérifiez votre solde ou réessayez.",
      );
    }

    // Démarrage polling si nécessaire
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
    } else {
      console.log(
        `⏭️ [POLLING] Skipped pour ${data.networkType} → webhook prendra le relais`,
      );
    }

    // Notification user
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
    // Si c'est déjà une AppError on la laisse remonter
    if (feexpayError.statusCode) throw feexpayError;

    await OperationRepository.updateTransactionStatus(
      transaction.id,
      TransactionsStatus.FAILED,
    );

    throw new BadRequestException(
      `Impossible d'initier le paiement: ${feexpayError.message}`,
    );
  }
};

// ─────────────────────────────────────────
// WITHDRAWAL
// ─────────────────────────────────────────

export const createWithdrawal = async (
  userId: string,
  data: WithdrawalDtoType,
) => {
  // Récupération service
  const service = await OperationRepository.findServiceById(data.serviceId);
  if (!service) {
    throw new NotFoundException("Service introuvable.");
  }

  // Récupération user
  const user = await OperationRepository.findUserWithProfile(userId);
  if (!user) {
    throw new UnauthorizedException("Utilisateur introuvable.");
  }

  // Création transaction PENDING
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

  // Numéro de transaction du jour
  const transactionNumber =
    await OperationRepository.findTransactionNumberForToday(transaction.id);

  // Alerte Telegram support
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

  // Notification user
  await notificationService.sendNotificationOnly(
    userId,
    "Retrait enregistré",
    `Votre demande de retrait de ${data.amount} XOF depuis ${service.displayName} a bien été reçue et est en cours de traitement.`,
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
