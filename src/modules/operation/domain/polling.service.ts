import {
  PipelineStep,
  PipelineStepStatus,
  TransactionsStatus,
} from "../../../../generated/prisma/enums";
import { notificationService } from "../../../shared/services/notification.service";
import {
  sendPollingFailureMessage,
  sendPollingSuccessMessage,
  sendPollingTimeoutAlert,
} from "../../../shared/services/telegram.service";
import { mocashClient } from "../../../shared/utils/mocashClient";
import { createTransactionLog } from "../../transaction/domain/transaction-log.repository";
import {
  claimTransaction,
  findTransactionById,
  findTransactionStatus,
  findTransactionNumberForToday,
  updateTransactionStatus,
} from "../operation.repository";

// REGISTRY DES POLLINGS ACTIFS

const activePollings = new Map<string, NodeJS.Timeout>();

export const stopPolling = (transactionId: string): void => {
  const interval = activePollings.get(transactionId);
  if (interval) {
    clearInterval(interval);
    activePollings.delete(transactionId);
    console.log(`🛑 [POLLING] Arrêté pour transaction ${transactionId}`);
  }
};

// CONTEXT

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

// HANDLER SUCCÈS

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

  // ── Log GATEWAY_CONFIRMED ──
  await createTransactionLog({
    transactionId,
    step: PipelineStep.GATEWAY_CONFIRMED,
    status: PipelineStepStatus.SUCCESS,
    message: "Paiement confirmé par le réseau",
    metadata: { delaySeconds },
  });

  if (serviceName === "1xBet" && accountId) {
    try {
      const claimed = await claimTransaction(transactionId);

      if (!claimed) {
        console.log(`⏭️ [POLLING] Transaction déjà verrouillée — skip Mocash`);
        return;
      }

      const { handlePointsOnTransaction } =
        await import("../../referral/referral.service");
      await handlePointsOnTransaction(userId, transactionId, desiredAmount);

      // ── Log MOCASH_CREDIT début ──
      await createTransactionLog({
        transactionId,
        step: PipelineStep.MOCASH_CREDIT,
        status: PipelineStepStatus.PENDING,
        message: "Envoi vers 1xBet via MoCash",
        metadata: { accountId, amount: desiredAmount },
      });

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
        // ── Log MOCASH_CREDIT succès ──
        await createTransactionLog({
          transactionId,
          step: PipelineStep.MOCASH_CREDIT,
          status: PipelineStepStatus.SUCCESS,
          message: `Compte 1xBet crédité de ${mocashResponse.summa} FCFA`,
          metadata: { creditedAmount: mocashResponse.summa },
        });

        // ── Log COMPLETED ──
        await createTransactionLog({
          transactionId,
          step: PipelineStep.COMPLETED,
          status: PipelineStepStatus.SUCCESS,
          message: "Transaction terminée avec succès",
        });

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
        // ── MoCash retourne success=false ou summa null ──
        // Transaction reste PENDING (claimTransaction l'a verrouillée à SUCCESS)
        // L'admin doit intervenir manuellement
        await createTransactionLog({
          transactionId,
          step: PipelineStep.MOCASH_CREDIT,
          status: PipelineStepStatus.FAILED,
          message: "MoCash a retourné success=false ou summa null",
          metadata: { mocashResponse },
        });

        await createTransactionLog({
          transactionId,
          step: PipelineStep.COMPLETED,
          status: PipelineStepStatus.FAILED,
          message:
            "Paiement reçu mais crédit 1xBet échoué — intervention admin requise",
        });

        console.error(
          `❌ [POLLING] Mocash success=false ou summa null:`,
          mocashResponse,
        );
      }
    } catch (mocashError: any) {
      // ── MoCash throw une exception ──
      await createTransactionLog({
        transactionId,
        step: PipelineStep.MOCASH_CREDIT,
        status: PipelineStepStatus.FAILED,
        message: mocashError.message,
      });

      await createTransactionLog({
        transactionId,
        step: PipelineStep.COMPLETED,
        status: PipelineStepStatus.FAILED,
        message:
          "Exception MoCash — paiement reçu mais crédit échoué — intervention admin requise",
      });

      console.error(`❌ [POLLING] Erreur Mocash:`, mocashError.message);
    }
  } else {
    // Autres services (pas 1xBet)
    const claimed = await claimTransaction(transactionId);

    if (!claimed) {
      console.log(`⏭️ [POLLING] Transaction déjà verrouillée — skip`);
      return;
    }

    const { handlePointsOnTransaction } =
      await import("../../referral/referral.service");
    await handlePointsOnTransaction(userId, transactionId, desiredAmount);

    await createTransactionLog({
      transactionId,
      step: PipelineStep.COMPLETED,
      status: PipelineStepStatus.SUCCESS,
      message: "Transaction terminée avec succès",
    });

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

// HANDLER ÉCHEC

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

  await createTransactionLog({
    transactionId,
    step: PipelineStep.GATEWAY_CONFIRMED,
    status: PipelineStepStatus.FAILED,
    message: reason,
  });

  await createTransactionLog({
    transactionId,
    step: PipelineStep.COMPLETED,
    status: PipelineStepStatus.FAILED,
    message: "Transaction échouée",
  });

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

      const statusCheck = await gatewayClient.verifyTransaction(ctx.gatewayRef);

      if (statusCheck.status === "SUCCESSFUL") {
        clearInterval(slowInterval);
        activePollings.delete(ctx.transactionId);
        await handleSuccess({ ...ctx, delaySeconds: 600 + attempts * 30 });
        return;
      }

      if (statusCheck.status === "FAILED") {
        clearInterval(slowInterval);
        activePollings.delete(ctx.transactionId);
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

        await createTransactionLog({
          transactionId: ctx.transactionId,
          step: PipelineStep.GATEWAY_CONFIRMED,
          status: PipelineStepStatus.PENDING,
          message: "Timeout 2h — webhook attendu",
        });
      }
    } catch (error: any) {
      console.error(`❌ [POLLING LENT] Erreur:`, error.message);
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
    `🔍 [POLLING RAPIDE] Démarrage pour transaction ${ctx.transactionId}`,
  );

  const fastInterval = setInterval(async () => {
    attempts++;

    try {
      const current = await findTransactionStatus(ctx.transactionId);

      if (current?.status === TransactionsStatus.SUCCESS) {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        return;
      }

      if (current?.status === TransactionsStatus.FAILED) {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        return;
      }

      const statusCheck = await gatewayClient.verifyTransaction(ctx.gatewayRef);

      if (statusCheck.status === "SUCCESSFUL") {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        await handleSuccess({ ...ctx, delaySeconds: attempts * 5 });
        return;
      }

      if (statusCheck.status === "FAILED") {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
        await handleFailure(ctx, "Client a refusé ou timeout USSD");
        return;
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);

        const transaction = await findTransactionById(ctx.transactionId);
        if (transaction?.transpublicId) {
          await sendPollingTimeoutAlert({
            transpublicId: transaction.transpublicId,
            amount: ctx.desiredAmount,
            clientName: ctx.clientFullName,
          });
        }

        await createTransactionLog({
          transactionId: ctx.transactionId,
          step: PipelineStep.GATEWAY_CONFIRMED,
          status: PipelineStepStatus.PENDING,
          message: "Timeout 10min — passage en polling lent",
        });

        startSlowPolling(ctx, gatewayClient);
      }
    } catch (error: any) {
      console.error(`❌ [POLLING RAPIDE] Erreur:`, error.message);
      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(fastInterval);
        activePollings.delete(ctx.transactionId);
      }
    }
  }, 5000);

  activePollings.set(ctx.transactionId, fastInterval);
};
