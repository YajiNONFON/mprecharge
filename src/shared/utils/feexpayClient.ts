// utils/feexpayClient.ts
import axios from "axios";

const FEEXPAY_API_URL = "https://api.feexpay.me/api";

interface FeeXPayConfig {
  shopId: string;
  apiKey: string;
  sandbox: boolean;
}

interface RequestToPayParams {
  amount: number;
  phoneNumber: string;
  network: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface FeeXPayResponse {
  success: boolean;
  message: string;
  reference: string;
  status: "PENDING" | "SUCCESS" | "FAILED" | "SUCCESSFUL";
  skipPolling?: boolean; // 👈 Indique au service de polling de ne pas polluer
}

// ════════════════════════════════════════════════════════════════
// Réseaux qui n'ont PAS d'endpoint de status → webhook uniquement
// ════════════════════════════════════════════════════════════════
export const WEBHOOK_ONLY_NETWORKS = ["celtiis_bj"];
export const FINAL_STATUS_NETWORKS = ["moov"];

class FeeXPayClient {
  private config: FeeXPayConfig;

  constructor(config: FeeXPayConfig) {
    this.config = config;
  }

  /**
   * Vérifie si un réseau fonctionne en webhook uniquement (pas de polling)
   */
  isWebhookOnly(network: string): boolean {
    return WEBHOOK_ONLY_NETWORKS.includes(network);
  }

  async requestToPay(params: RequestToPayParams): Promise<FeeXPayResponse> {
    const networkEndpoints: Record<string, string> = {
      // Bénin
      mtn: "/transactions/public/requesttopay/mtn",
      moov: "/transactions/public/requesttopay/moov",
      celtiis_bj: "/transactions/public/requesttopay/celtiis_bj",

      // Togo
      moov_tg: "/transactions/public/requesttopay/moov_tg",

      // Burkina Faso
      moov_bf: "/transactions/public/requesttopay/moov_bf",
      orange_bf: "/transactions/public/requesttopay/orange_bf",

      // Sénégal
      orange_sn: "/transactions/public/requesttopay/orange_sn",

      // Côte d'Ivoire
      mtn_ci: "/transactions/public/requesttopay/mtn_ci",
      moov_ci: "/transactions/public/requesttopay/moov_ci",
      orange_ci: "/transactions/public/requesttopay/orange_ci",
    };

    const endpoint = networkEndpoints[params.network];

    if (!endpoint) {
      throw new Error(
        `Réseau de paiement non supporté: ${params.network}. Réseaux disponibles: ${Object.keys(networkEndpoints).join(", ")}`,
      );
    }

    const url = `${FEEXPAY_API_URL}${endpoint}`;

    try {
      const response = await axios({
        url,
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        data: {
          shop: this.config.shopId,
          amount: params.amount,
          phoneNumber: params.phoneNumber,
          firstName: params.firstName || "Client",
          lastName: params.lastName || "Test",
          email: process.env.FEEXPAY_EMAIL!,
        },
      });

      console.log(
        `✅ Paiement ${params.network} initié avec succès:`,
        response.data,
      );

      const formatted = this.formatResponse(response.data, params.network);

      // 👇 Signaler au appelant que ce réseau ne supporte pas le polling
      if (this.isWebhookOnly(params.network)) {
        console.log(
          `⏭️ [${params.network.toUpperCase()}] Réseau webhook uniquement → polling désactivé`,
        );
        formatted.skipPolling = true;
      }

      return formatted;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      throw new Error(
        `Impossible d'initier le paiement ${params.network}: ${errorMessage}`,
      );
    }
  }

  /*private formatResponse(data: any, network?: string): FeeXPayResponse {
    return {
      success: data.success ?? true,
      message: data.message || "Paiement initié",
      reference: data.reference || data.transactionId || data.transaction_id,
      status: "PENDING",
      skipPolling: false,
    };
  }*/

  private formatResponse(data: any, network?: string): FeeXPayResponse {
    const isFinalStatus =
      data.status === "FAILED" || data.status === "SUCCESSFUL";
    const isWebhookOnly = WEBHOOK_ONLY_NETWORKS.includes(network ?? "");
    const isFinalStatusNetwork = FINAL_STATUS_NETWORKS.includes(network ?? "");

    return {
      success: data.success ?? true,
      message: data.message || "Paiement initié",
      reference: data.reference || data.transactionId || data.transaction_id,
      status: data.status || "PENDING",
      // Skip polling si : réseau webhook-only OU statut déjà final
      skipPolling: isWebhookOnly || (isFinalStatusNetwork && isFinalStatus),
    };
  }

  /**
   * Vérifier le statut d'une transaction (MTN, Moov, etc.)
   * ⚠️ Ne pas appeler pour les réseaux WEBHOOK_ONLY
   */
  async verifyTransaction(
    reference: string,
    network?: string,
  ): Promise<FeeXPayResponse> {
    // Sécurité — ne jamais polluer pour les réseaux webhook only
    if (network && this.isWebhookOnly(network)) {
      console.log(`⏭️ [VERIFY] Réseau ${network} webhook uniquement → skip`);
      return {
        success: true,
        message: "Webhook only network",
        reference,
        status: "PENDING",
        skipPolling: true,
      };
    }

    try {
      const response = await axios({
        url: `${FEEXPAY_API_URL}/transactions/status/${reference}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      });

      console.log(
        `📦 [VERIFY] Réponse pour ${reference}:`,
        JSON.stringify(response.data, null, 2),
      );

      const rawStatus = response.data.status;

      return {
        success: true,
        message: response.data.message || "",
        reference,
        status: rawStatus,
        skipPolling: false,
      };
    } catch (error: any) {
      console.error(`❌ [VERIFY] Status HTTP:`, error.response?.status);
      console.error(
        `❌ [VERIFY] Body:`,
        JSON.stringify(error.response?.data, null, 2),
      );
      console.error(`❌ [VERIFY] Message:`, error.message);
      throw new Error("Impossible de vérifier la transaction");
    }
  }
}

// ✅ Export de l'instance configurée
export const feexpayClient = new FeeXPayClient({
  shopId: process.env.FEEXPAY_SHOP_ID!,
  apiKey: process.env.FEEXPAY_API_KEY!,
  sandbox: true,
});

export { FeeXPayClient };
