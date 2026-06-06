// services/telegram.services.ts
import axios from "axios";
import { prisma } from "../../infrastructure/database/prisma";

// ════════════════════════════════════════════════════════════════
// 🤖 CONFIGURATION DES 4 BOTS
// ════════════════════════════════════════════════════════════════

// 🚀 Bot 1 : Dépôts Polling (Temps Réel - Crédits Rapides)
const BOT_POLLING_TOKEN = process.env.TELEGRAM_POLLING_BOT_TOKEN!;
const BOT_POLLING_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// ✅ Bot 2 : Webhook FeeXPay (Confirmation Différée)
const BOT_WEBHOOK_TOKEN = process.env.TELEGRAM_WEBHOOK_BOT_TOKEN!;
const BOT_WEBHOOK_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// 💸 Bot 3 : Retraits (Opérations Manuelles)
const BOT_WITHDRAWAL_TOKEN = process.env.TELEGRAM_WITHDRAWAL_BOT_TOKEN!;
const BOT_WITHDRAWAL_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// 📊 Bot 4 : Audit & Rapports (Fin de Journée)
const BOT_AUDIT_TOKEN = process.env.TELEGRAM_AUDIT_BOT_TOKEN!;
const BOT_AUDIT_CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

// ════════════════════════════════════════════════════════════════
// 📨 FONCTION GÉNÉRIQUE D'ENVOI
// ════════════════════════════════════════════════════════════════

async function sendMessage(
  botToken: string,
  chatId: string,
  message: string,
  botName: string,
): Promise<void> {
  try {
    await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
    });
    console.log(`✅ [${botName}] Message envoyé`);
  } catch (error: any) {
    console.error(`❌ [${botName}] Erreur envoi:`, error.message);
  }
}

// ════════════════════════════════════════════════════════════════
// 🚀 BOT 1 : DÉPÔTS POLLING (Temps Réel)
// ════════════════════════════════════════════════════════════════

/**
 * Message quand le polling détecte un paiement réussi et crédite immédiatement
 */
export async function sendPollingSuccessMessage(data: {
  transactionNumber: number;
  transpublicId: string;
  amount: number;
  clientName: string;
  phoneNumber: string;
  accountId: string;
  creditedAmount: number;
  delaySeconds: number;
  service: string;
}): Promise<void> {
  const message = `
🚀 <b>POLLING #${data.transactionNumber}</b>

✅ <b>CRÉDIT RÉUSSI</b>
🆔 ${data.transpublicId}
💵 Montant demandé : ${data.amount.toLocaleString()} XOF
💰 Montant crédité : ${data.creditedAmount.toLocaleString()} XOF
👤 Client : ${data.clientName}
📱 Téléphone : ${data.phoneNumber}
🎯 Service : ${data.service}
🆔 Compte : ${data.accountId}
⏱️ Délai détection : ${data.delaySeconds}s

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_POLLING_TOKEN,
    BOT_POLLING_CHAT_ID,
    message,
    "BOT POLLING",
  );
}

/**
 * Message quand le polling détecte un échec
 */
export async function sendPollingFailureMessage(data: {
  transactionNumber: number;
  transpublicId: string;
  amount: number;
  accountId: string;

  clientName: string;
  phoneNumber: string;
  reason: string;
}): Promise<void> {
  const message = `
❌ <b>POLLING #${data.transactionNumber}</b>

🚫 <b>PAIEMENT ÉCHOUÉ</b>
🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Client : ${data.clientName}
📱 Téléphone : ${data.phoneNumber}
🆔 Compte : ${data.accountId}

⚠️ Raison : ${data.reason}

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_POLLING_TOKEN,
    BOT_POLLING_CHAT_ID,
    message,
    "BOT POLLING",
  );
}

/**
 * Alerte quand le polling timeout (transaction lente)
 */
export async function sendPollingTimeoutAlert(data: {
  transpublicId: string;
  amount: number;
  clientName: string;
}): Promise<void> {
  const message = `
⏱️ <b>POLLING TIMEOUT</b>

⚠️ Transaction trop lente (>10 min)
🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Client : ${data.clientName}

📝 Le webhook FeeXPay prendra le relais
🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_POLLING_TOKEN,
    BOT_POLLING_CHAT_ID,
    message,
    "BOT POLLING",
  );
}

// ════════════════════════════════════════════════════════════════
// ✅ BOT 2 : WEBHOOK FEEXPAY (Confirmation Différée)
// ════════════════════════════════════════════════════════════════

/**
 * Confirmation webhook après crédit polling (cas normal)
 */
export async function sendWebhookConfirmationMessage(data: {
  transactionNumber: number;
  transpublicId: string;
  amount: number;
  clientName: string;
  phoneNumber: string;
  accountId: string;
  delayMinutes: number;
  service: string;
}): Promise<void> {
  const message = `
✅ <b>WEBHOOK #${data.transactionNumber}</b>

🔔 <b>FEEXPAY CONFIRMÉ</b>
🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Client : ${data.clientName}
📱 Téléphone : ${data.phoneNumber}
🎯 Service : ${data.service}
🆔 Compte : ${data.accountId}
⏱️ Reçu ${data.delayMinutes} min après polling

📝 <b>Statut :</b> Transaction déjà créditée via polling ✅

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_WEBHOOK_TOKEN,
    BOT_WEBHOOK_CHAT_ID,
    message,
    "BOT WEBHOOK",
  );
}

/**
 * Crédit via webhook (fallback quand polling a timeout)
 */
export async function sendWebhookFallbackCreditMessage(data: {
  transactionNumber: number;
  transpublicId: string;
  amount: number;
  creditedAmount: number;
  clientName: string;
  phoneNumber: string;
  accountId: string;
  service: string;
}): Promise<void> {
  const message = `
⚠️ <b>WEBHOOK #${data.transactionNumber} - FALLBACK</b>

💰 <b>CRÉDIT VIA WEBHOOK</b>
🆔 ${data.transpublicId}
💵 Montant demandé : ${data.amount.toLocaleString()} XOF
💰 Montant crédité : ${data.creditedAmount.toLocaleString()} XOF
👤 Client : ${data.clientName}
📱 Téléphone : ${data.phoneNumber}
🎯 Service : ${data.service}
🆔 Compte : ${data.accountId}

⏰ <b>Raison :</b> Le polling avait timeout (transaction >10 min)

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_WEBHOOK_TOKEN,
    BOT_WEBHOOK_CHAT_ID,
    message,
    "BOT WEBHOOK",
  );
}

/**
 * Webhook signale un échec
 */
export async function sendWebhookFailureMessage(data: {
  transactionNumber: number;
  transpublicId: string;
  amount: number;
  accountId: string;

  clientName: string;
  phoneNumber: string;
}): Promise<void> {
  const message = `
❌ <b>WEBHOOK #${data.transactionNumber}</b>

🚫 <b>PAIEMENT ÉCHOUÉ</b>
🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Client : ${data.clientName}
📱 Téléphone : ${data.phoneNumber}
🆔 Compte : ${data.accountId}


🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_WEBHOOK_TOKEN,
    BOT_WEBHOOK_CHAT_ID,
    message,
    "BOT WEBHOOK",
  );
}

/**
 * Alerte critique : client crédité mais webhook dit échec
 */
export async function sendWebhookCriticalAlert(data: {
  transpublicId: string;
  amount: number;
  creditedAmount: number;
  clientName: string;
  accountId: string;
}): Promise<void> {
  const message = `
🚨🚨🚨 <b>ALERTE CRITIQUE</b>

⚠️ <b>CRÉDIT SANS CONFIRMATION FEEXPAY</b>

Client a été crédité via polling MAIS FeeXPay rejette le paiement !

🆔 ${data.transpublicId}
💵 Montant transaction : ${data.amount.toLocaleString()} XOF
💰 Montant crédité : ${data.creditedAmount.toLocaleString()} XOF
👤 Client : ${data.clientName}
🆔 Compte : ${data.accountId}

🔧 <b>ACTION URGENTE REQUISE :</b>
1. Vérifier si le client mobile money a été débité
2. Si NON débité → Débiter ${data.creditedAmount} XOF du compte
3. Si OUI débité → Contacter FeeXPay (erreur de leur côté)

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_WEBHOOK_TOKEN,
    BOT_WEBHOOK_CHAT_ID,
    message,
    "BOT WEBHOOK",
  );
}

// ════════════════════════════════════════════════════════════════
// 💸 BOT 3 : RETRAITS (Opérations Manuelles)
// ════════════════════════════════════════════════════════════════

/**
 * Nouvelle demande de retrait
 */
export async function sendWithdrawalRequestMessage(data: {
  transactionNumber: number;
  transpublicId: string;
  amount: number;
  beneficiaryName: string;
  phoneNumber: string;
  networkType: string;
  withdrawalCode?: string;
  accountId: string;
  service: string;
}): Promise<void> {
  const message = `
💸 <b>RETRAIT #${data.transactionNumber}</b>

🆕 <b>NOUVELLE DEMANDE</b>
🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Bénéficiaire : ${data.beneficiaryName}
📱 Numéro : ${data.phoneNumber}
🌐 Réseau : ${data.networkType}
${data.withdrawalCode ? `🔐 Code retrait : ${data.withdrawalCode}` : ""}
🎯 Service : ${data.service}
🆔 Compte : ${data.accountId}

⚠️ <b>Action requise :</b> Traitement manuel

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_WITHDRAWAL_TOKEN,
    BOT_WITHDRAWAL_CHAT_ID,
    message,
    "BOT RETRAIT",
  );
}

/**
 * Confirmation retrait traité
 */
export async function sendWithdrawalCompletedMessage(data: {
  transpublicId: string;
  amount: number;
  beneficiaryName: string;
}): Promise<void> {
  const message = `
✅ <b>RETRAIT TRAITÉ</b>

🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Bénéficiaire : ${data.beneficiaryName}

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(
    BOT_WITHDRAWAL_TOKEN,
    BOT_WITHDRAWAL_CHAT_ID,
    message,
    "BOT RETRAIT",
  );
}

// ════════════════════════════════════════════════════════════════
// 📊 BOT 4 : AUDIT & RAPPORTS (Fin de Journée)
// ════════════════════════════════════════════════════════════════

/**
 * Rapport quotidien automatique (appelé par cron à 23h59)
 */
export async function sendDailyAuditReport(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Récupérer toutes les transactions du jour
    const deposits = await prisma.transaction.findMany({
      where: {
        created_at: { gte: today, lt: tomorrow },
        type: "DEPOSIT",
      },
      orderBy: { created_at: "asc" },
    });

    const withdrawals = await prisma.transaction.findMany({
      where: {
        created_at: { gte: today, lt: tomorrow },
        type: "WITHDRAWAL",
      },
    });

    // Stats dépôts
    const totalDeposits = deposits.length;
    const successDeposits = deposits.filter(
      (t) => t.status === "SUCCESS",
    ).length;
    const failedDeposits = deposits.filter((t) => t.status === "FAILED").length;
    const pendingDeposits = deposits.filter(
      (t) => t.status === "PENDING",
    ).length;

    const totalAmount = deposits
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + t.amount, 0);

    // Crédits via polling (< 10 min)
    const pollingCredits = deposits.filter((t) => {
      if (t.status !== "SUCCESS" || !t.updated_at) return false;
      const delay =
        new Date(t.updated_at).getTime() - new Date(t.created_at).getTime();
      return delay < 600000; // < 10 minutes
    }).length;

    const webhookCredits = successDeposits - pollingCredits;

    // Webhooks manquants (crédités via polling mais pas de webhook après 1h)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const missingWebhooks = deposits.filter((t) => {
      if (t.status !== "SUCCESS" || !t.updated_at) return false;
      const wasCreditedByPolling =
        new Date(t.updated_at).getTime() - new Date(t.created_at).getTime() <
        600000;
      const createdBeforeOneHour = new Date(t.created_at) < oneHourAgo;
      // Vérifier si webhook reçu (tu peux ajouter un champ validatedAt dans ton modèle)
      return wasCreditedByPolling && createdBeforeOneHour;
    });

    // Stats retraits
    const totalWithdrawals = withdrawals.length;
    const completedWithdrawals = withdrawals.filter(
      (t) => t.status === "SUCCESS",
    ).length;
    const pendingWithdrawals = withdrawals.filter(
      (t) => t.status === "PENDING",
    ).length;

    const withdrawalAmount = withdrawals
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + t.amount, 0);

    const message = `
📊 <b>RAPPORT DE FIN DE JOURNÉE</b>
📅 ${today.toLocaleDateString("fr-FR")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>DÉPÔTS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔢 Total transactions : ${totalDeposits}
✅ Réussies : ${successDeposits} (${totalDeposits > 0 ? ((successDeposits / totalDeposits) * 100).toFixed(1) : 0}%)
❌ Échouées : ${failedDeposits} (${totalDeposits > 0 ? ((failedDeposits / totalDeposits) * 100).toFixed(1) : 0}%)
⏳ En attente : ${pendingDeposits}

💵 Montant total : ${totalAmount.toLocaleString()} XOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ <b>PERFORMANCE POLLING</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 Crédits via Polling : ${pollingCredits} (${successDeposits > 0 ? ((pollingCredits / successDeposits) * 100).toFixed(1) : 0}%)
🕐 Crédits via Webhook : ${webhookCredits} (${successDeposits > 0 ? ((webhookCredits / successDeposits) * 100).toFixed(1) : 0}%)

${
  missingWebhooks.length > 0
    ? `⚠️ <b>Webhooks manquants :</b> ${missingWebhooks.length}
${missingWebhooks
  .slice(0, 5)
  .map((t) => `   • ${t.transpublicId} - ${t.amount} XOF`)
  .join("\n")}
${missingWebhooks.length > 5 ? `   ... et ${missingWebhooks.length - 5} autres` : ""}`
    : "✅ Tous les webhooks reçus"
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💸 <b>RETRAITS</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔢 Total demandes : ${totalWithdrawals}
✅ Traités : ${completedWithdrawals}
⏳ En attente : ${pendingWithdrawals}

💵 Montant total : ${withdrawalAmount.toLocaleString()} XOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 <b>BILAN</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💰 Dépôts : +${totalAmount.toLocaleString()} XOF
💸 Retraits : -${withdrawalAmount.toLocaleString()} XOF
📊 Net : ${(totalAmount - withdrawalAmount).toLocaleString()} XOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>ALERTES</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${pendingDeposits > 0 ? `⚠️ ${pendingDeposits} dépôt(s) en attente` : "✅ Aucun dépôt en attente"}
${pendingWithdrawals > 0 ? `⚠️ ${pendingWithdrawals} retrait(s) en attente` : "✅ Aucun retrait en attente"}
${failedDeposits > totalDeposits * 0.1 ? `⚠️ Taux d'échec élevé : ${((failedDeposits / totalDeposits) * 100).toFixed(1)}%` : "✅ Taux d'échec normal"}
${missingWebhooks.length > 0 ? `⚠️ ${missingWebhooks.length} webhook(s) manquant(s)` : "✅ Tous les webhooks reçus"}

🕒 Généré le ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
    `;

    await sendMessage(BOT_AUDIT_TOKEN, BOT_AUDIT_CHAT_ID, message, "BOT AUDIT");

    await prisma.$disconnect();
  } catch (error: any) {
    console.error("❌ Erreur génération rapport journalier:", error);
  }
}

/**
 * Alerte si une transaction est bloquée trop longtemps
 */
export async function sendStuckTransactionAlert(data: {
  transpublicId: string;
  amount: number;
  clientName: string;
  hoursStuck: number;
}): Promise<void> {
  const message = `
⚠️ <b>TRANSACTION BLOQUÉE</b>

🆔 ${data.transpublicId}
💵 Montant : ${data.amount.toLocaleString()} XOF
👤 Client : ${data.clientName}
⏰ Bloquée depuis : ${data.hoursStuck}h

🔧 Action requise : Vérification manuelle

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(BOT_AUDIT_TOKEN, BOT_AUDIT_CHAT_ID, message, "BOT AUDIT");
}

/**
 * Alerte si taux d'échec anormal détecté
 */
export async function sendHighFailureRateAlert(data: {
  totalTransactions: number;
  failedTransactions: number;
  failureRate: number;
}): Promise<void> {
  const message = `
🚨 <b>TAUX D'ÉCHEC ANORMAL</b>

📊 Total transactions : ${data.totalTransactions}
❌ Échecs : ${data.failedTransactions}
📈 Taux : ${data.failureRate.toFixed(1)}%

⚠️ Le taux d'échec dépasse 15% (seuil normal : 5-10%)

🔧 Vérifier :
• Solde compte FeeXPay
• Status API FeeXPay
• Problèmes opérateurs mobile money

🕒 ${new Date().toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo" })}
  `;

  await sendMessage(BOT_AUDIT_TOKEN, BOT_AUDIT_CHAT_ID, message, "BOT AUDIT");
}

// ════════════════════════════════════════════════════════════════
// 🔧 FONCTION UTILITAIRE : Obtenir le Numéro de Transaction
// ════════════════════════════════════════════════════════════════

/**
 * Récupère le numéro séquentiel de la transaction pour la journée
 */
export async function getTransactionNumberForToday(
  transactionId: string,
): Promise<number> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) return 0;

    const countBefore = await prisma.transaction.count({
      where: {
        created_at: {
          gte: today,
          lt: transaction.created_at,
        },
        type: transaction.type,
      },
    });

    await prisma.$disconnect();

    return countBefore + 1;
  } catch (error) {
    console.error("❌ Erreur calcul numéro transaction:", error);
    return 0;
  }
}

// ════════════════════════════════════════════════════════════════
// 🔄 COMPATIBILITÉ AVEC TON CODE EXISTANT
// ════════════════════════════════════════════════════════════════

/**
 * Fonction legacy pour rétro-compatibilité
 * @deprecated Utiliser les fonctions spécifiques à chaque bot
 */
/*export async function sendTelegramMessage(message: string): Promise<void> {
  // Par défaut, envoyer au bot polling (opérationnel)
  await sendMessage(BOT_POLLING_TOKEN, BOT_POLLING_CHAT_ID, message, "BOT POLLING");
}*/
