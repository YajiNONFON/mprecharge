import { TransactionsStatus } from "../../../../generated/prisma/enums";
import { notificationService } from "../../../shared/services/notification.service";
import {
  sendPollingFailureMessage,
  sendPollingSuccessMessage,
  sendPollingTimeoutAlert,
} from "../../../shared/services/telegram.service";
import { mocashClient } from "../../../shared/utils/mocashClient";
import {
  claimTransaction,
  findTransactionById,
  findTransactionStatus,
  findTransactionNumberForToday,
  updateTransactionStatus,
} from "../operation.repository";

// REGISTRY DES POLLINGS ACTIFS

const activePollings = new Map<string, NodeJS.Timeout>();

// STOP POLLING (appelé par webhook)

export const stopPolling = (transactionId: string): void => {
  const interval = activePollings.get(transactionId);
  if (interval) {
    clearInterval(interval);
    activePollings.delete(transactionId);
    console.log(`🛑 [POLLING] Arrêté pour transaction ${transactionId}`);
  }
};

// HANDLER SUCCÈS — partagé polling rapide + lent

interface PollingContext {
  transactionId: string;
  gatewayRef: string;
  serviceName: string;
  accountId: string;
  userId: string;
  serviceId: string;
  desiredAmount: number;
  clientFullName: string;
  phoneNumber: string;
  delaySeconds: number;
}

const handleSuccess = async (ctx: PollingContext): Promise<void> => {
  const {
    transactionId,
    serviceName,
    accountId,
    userId,
    serviceId,
    desiredAmount,
    clientFullName,
    phoneNumber,
    delaySeconds,
  } = ctx;

  if (serviceName === "1xBet" && accountId) {
    try {
      const claimed = await claimTransaction(transactionId);

      if (!claimed) {
        console.log(`⏭️ [POLLING] Transaction déjà verrouillée — skip Mocash`);
        return;
      }

      // ← Points attribués dès que le verrou est obtenu
      const { handlePointsOnTransaction } =
        await import("../../referral/referral.service");
      await handlePointsOnTransaction(userId, transactionId, desiredAmount);

      const mocashResponse = await mocashClient.depositToAccount({
        userId: accountId,
        amount: desiredAmount,
        language: "fr",
      });

      if (
        mocashResponse &&
        mocashResponse.success &&
        mocashResponse.summa != null
      ) {
        await notificationService.sendNotificationOnly(
          userId,
          "Compte crédité ✅",
          `Votre compte 1xbet a été crédité de ${mocashResponse.summa} FCFA. Bon jeu !`,
          "SUCCESS",
          serviceId,
        );

        const transactionNumber =
          await findTransactionNumberForToday(transactionId);
        const transaction = await findTransactionById(transactionId);

        if (!transaction?.transpublicId) {
          console.error(
            `❌ [POLLING] transpublicId manquant pour ${transactionId}`,
          );
          return;
        }

        await sendPollingSuccessMessage({
          transactionNumber,
          transpublicId: transaction.transpublicId,
          amount: desiredAmount,
          clientName: clientFullName,
          phoneNumber,
          accountId,
          creditedAmount: mocashResponse.summa,
          delaySeconds,
          service: serviceName,
        });

        console.log(`✅ [POLLING] Crédit Mocash réussi`);
      } else {
        console.error(
          `❌ [POLLING] Mocash success=false ou summa null:`,
          mocashResponse,
        );
      }
    } catch (mocashError: any) {
      console.error(`❌ [POLLING] Erreur Mocash:`, mocashError.message);
    }
  } else {
    const claimed = await claimTransaction(transactionId);

    if (!claimed) {
      console.log(`⏭️ [POLLING] Transaction déjà verrouillée — skip`);
      return;
    }

    // ← Points attribués ici aussi pour les autres services
    const { handlePointsOnTransaction } =
      await import("../../referral/referral.service");
    await handlePointsOnTransaction(userId, transactionId, desiredAmount);

    await notificationService.sendNotificationOnly(
      userId,
      "Paiement confirmé ✅",
      `Votre paiement de ${desiredAmount} FCFA a été confirmé.`,
      "SUCCESS",
      serviceId,
    );

    const transactionNumber =
      await findTransactionNumberForToday(transactionId);
    const transaction = await findTransactionById(transactionId);

    if (transaction?.transpublicId) {
      await sendPollingSuccessMessage({
        transactionNumber,
        transpublicId: transaction.transpublicId,
        amount: desiredAmount,
        clientName: clientFullName,
        phoneNumber,
        accountId,
        creditedAmount: desiredAmount,
        delaySeconds,
        service: serviceName,
      });
    }
  }
};

// HANDLER ÉCHEC — partagé polling rapide + lent

const handleFailure = async (
  ctx: PollingContext,
  reason: string,
): Promise<void> => {
  const {
    transactionId,
    userId,
    serviceId,
    desiredAmount,
    clientFullName,
    phoneNumber,
  } = ctx;

  await updateTransactionStatus(transactionId, TransactionsStatus.FAILED);

  await notificationService.sendNotificationOnly(
    userId,
    "Paiement échoué ❌",
    `Votre paiement de ${desiredAmount} FCFA a échoué ou a été annulé.`,
    "ERROR",
    serviceId,
  );

  const transactionNumber = await findTransactionNumberForToday(transactionId);
  const transaction = await findTransactionById(transactionId);

  if (transaction?.transpublicId) {
    await sendPollingFailureMessage({
      transactionNumber,
      transpublicId: transaction.transpublicId,
      amount: desiredAmount,
      clientName: clientFullName,
      accountId: transaction.accountId || "N/A",
      phoneNumber,
      reason,
    });
  }
};

// POLLING LENT (30s × 240 = 2h max)

const startSlowPolling = (
  ctx: PollingContext,
  gatewayClient: {
    verifyTransaction: (ref: string) => Promise<{ status: string }>;
  },
): void => {
  let attempts = 0;
  const MAX_SLOW_ATTEMPTS = 240;

  console.log(
    `🐌 [POLLING LENT] Démarrage pour transaction ${ctx.transactionId}`,
  );

  const slowInterval = setInterval(async () => {
    attempts++;

    try {
      const current = await findTransactionStatus(ctx.transactionId);

      if (current?.status !== TransactionsStatus.PENDING) {
        console.log(
          `✅ [POLLING LENT] Traitée ailleurs (${current?.status}) — arrêt`,
        );
        clearInterval(slowInterval);
        activePollings.delete(ctx.transactionId);
        return;
      }

      console.log(
        `🔍 [POLLING LENT] Tentative ${attempts}/${MAX_SLOW_ATTEMPTS}`,
      );

      const statusCheck = await gatewayClient.verifyTransaction(ctx.gatewayRef);

      if (statusCheck.status === "SUCCESSFUL") {
        clearInterval(slowInterval);
        activePollings.delete(ctx.transactionId);
        console.log(
          `✅ [POLLING LENT] SUCCESSFUL après ${attempts} tentatives`,
        );
        await handleSuccess({
          ...ctx,
          delaySeconds: 600 + attempts * 30,
        });
        return;
      }

      if (statusCheck.status === "FAILED") {
        clearInterval(slowInterval);
        activePollings.delete(ctx.transactionId);
        console.log(`❌ [POLLING LENT] FAILED détecté`);
        await handleFailure(
          ctx,
          "Timeout polling lent — client a refusé ou annulé",
        );
        return;
      }

      if (attempts >= MAX_SLOW_ATTEMPTS) {
        clearInterval(slowInterval);
        activePollings.delete(ctx.transactionId);
        console.log(
          `⏱️ [POLLING LENT] Timeout absolu 2h — webhook prend le relais`,
        );
        return;
      }
    } catch (error: any) {
      console.error(`❌ [POLLING LENT] Erreur inattendue:`, error.message);
    }
  }, 30000);

  activePollings.set(ctx.transactionId, slowInterval);
};

// POLLING RAPIDE (5s × 120 = 10min)

export const startPolling = (
  ctx: PollingContext,
  gatewayClient: {
    verifyTransaction: (ref: string) => Promise<{ status: string }>;
  },
): void => {
  let attempts = 0;
  const MAX_ATTEMPTS = 120;

  console.log(
    `🔍 [POLLING RAPIDE] Démarrage pour transaction ${ctx.transactionId} (ref: ${ctx.gatewayRef})`,
  );

  const fastInterval = setInterval(async () => {
    attempts++;

    try {
      // Garde — webhook a peut-être déjà traité
      const current = await findTransactionStatus(ctx.transactionId);

      if (current?.status === TransactionsStatus.SUCCESS) {
        console.log(
          `✅ [POLLING RAPIDE] Déjà traité par webhook (SUCCESS) — arrêt`,
        );
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        return;
      }

      if (current?.status === TransactionsStatus.FAILED) {
        console.log(
          `❌ [POLLING RAPIDE] Déjà traité par webhook (FAILED) — arrêt`,
        );
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        return;
      }

      console.log(
        `🔍 [POLLING RAPIDE] Tentative ${attempts}/${MAX_ATTEMPTS}...`,
      );

      const statusCheck = await gatewayClient.verifyTransaction(ctx.gatewayRef);
      console.log(`📊 [POLLING RAPIDE] Statut reçu: ${statusCheck.status}`);

      if (statusCheck.status === "SUCCESSFUL") {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        console.log(`✅ [POLLING RAPIDE] SUCCESSFUL après ${attempts * 5}s`);
        await handleSuccess({
          ...ctx,
          delaySeconds: attempts * 5,
        });
        return;
      }

      if (statusCheck.status === "FAILED") {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        console.log(`❌ [POLLING RAPIDE] FAILED détecté`);
        await handleFailure(ctx, "Client a refusé ou timeout USSD");
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        console.log(
          `⏱️ [POLLING RAPIDE] Timeout 10min — passage en polling LENT`,
        );

        const transaction = await findTransactionById(ctx.transactionId);
        if (transaction?.transpublicId) {
          await sendPollingTimeoutAlert({
            transpublicId: transaction.transpublicId,
            amount: ctx.desiredAmount,
            clientName: ctx.clientFullName,
          });
        }

        startSlowPolling(ctx, gatewayClient);
        return;
      }
    } catch (error: any) {
      console.error(`❌ [POLLING RAPIDE] Erreur inattendue:`, error.message);
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
      }
    }
  }, 5000);

  activePollings.set(ctx.transactionId, fastInterval);
};
