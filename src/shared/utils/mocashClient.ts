// utils/mocashClient.ts
import axios from "axios";
import crypto from "crypto";

const MOCASH_API_URL = process.env.MOCASH_API_URL;

interface MocashConfig {
  hash: string;
  cashdeskid: number;
  cashierpass: string;
  login?: string;
}

interface DepositParams {
  userId: string;
  amount: number;
  language?: string;
}

interface MocashDepositResponse {
  summa: number | null;
  success: boolean;
  messageId: number | null;
  message: string;
}

class MocashClient {
  private config: MocashConfig;

  constructor(config: MocashConfig) {
    this.config = config;
    this.validateConfig();
  }

  private validateConfig() {
    if (!this.config.hash) {
      throw new Error("❌ MOCASH_HASH manquant");
    }
    if (!this.config.cashdeskid) {
      throw new Error("❌ MOCASH_CASHDESK_ID manquant");
    }
    if (!this.config.cashierpass) {
      throw new Error("❌ MOCASH_CASHIER_PASS manquant");
    }
  }

  private generateDepositSignature(
    userId: string,
    amount: number,
    language: string = "fr",
  ): { signature: string; confirm: string } {
    const step1String = `hash=${this.config.hash}&lng=${language}&userid=${userId}`;
    const step1Hash = crypto
      .createHash("sha256")
      .update(step1String)
      .digest("hex");

    const step2String = `summa=${amount}&cashierpass=${this.config.cashierpass}&cashdeskid=${this.config.cashdeskid}`;
    const step2Hash = crypto
      .createHash("md5")
      .update(step2String)
      .digest("hex");

    const signature = crypto
      .createHash("sha256")
      .update(step1Hash + step2Hash)
      .digest("hex");

    const confirmString = `${userId}:${this.config.hash}`;
    const confirm = crypto
      .createHash("md5")
      .update(confirmString)
      .digest("hex");

    return { signature, confirm };
  }

  private generateBalanceSignature(dt: string): {
    signature: string;
    confirm: string;
  } {
    const step1String = `hash=${this.config.hash}&cashdeskid=${this.config.cashdeskid}&dt=${dt}`;
    const step1Hash = crypto
      .createHash("sha256")
      .update(step1String)
      .digest("hex");

    const step2String = `dt=${dt}&cashierpass=${this.config.cashierpass}&cashdeskid=${this.config.cashdeskid}`;
    const step2Hash = crypto
      .createHash("md5")
      .update(step2String)
      .digest("hex");

    const signature = crypto
      .createHash("sha256")
      .update(step1Hash + step2Hash)
      .digest("hex");

    const confirmString = `${this.config.cashdeskid}:${this.config.hash}`;
    const confirm = crypto
      .createHash("md5")
      .update(confirmString)
      .digest("hex");

    return { signature, confirm };
  }

  private generateSearchSignature(userId: string): {
    signature: string;
    confirm: string;
  } {
    const step1String = `hash=${this.config.hash}&userid=${userId}&cashdeskid=${this.config.cashdeskid}`;
    const step1Hash = crypto
      .createHash("sha256")
      .update(step1String)
      .digest("hex");

    const step2String = `userid=${userId}&cashierpass=${this.config.cashierpass}&hash=${this.config.hash}`;
    const step2Hash = crypto
      .createHash("md5")
      .update(step2String)
      .digest("hex");

    const signature = crypto
      .createHash("sha256")
      .update(step1Hash + step2Hash)
      .digest("hex");

    const confirmString = `${userId}:${this.config.hash}`;
    const confirm = crypto
      .createHash("md5")
      .update(confirmString)
      .digest("hex");

    return { signature, confirm };
  }

  async depositToAccount(
    params: DepositParams,
  ): Promise<MocashDepositResponse> {
    try {
      const language = params.language || "fr";

      const { signature, confirm } = this.generateDepositSignature(
        params.userId,
        params.amount,
        language,
      );

      const url = `${MOCASH_API_URL}/Deposit/${params.userId}/Add`;

      const requestBody = {
        cashdeskid: this.config.cashdeskid,
        lng: language,
        summa: params.amount,
        confirm: confirm,
      };

      const response = await axios({
        method: "POST",
        url: url,
        headers: {
          "Content-Type": "application/json",
          sign: signature,
        },
        data: requestBody,
        timeout: 30000,
        validateStatus: () => true,
      });

      if (response.status === 200 || response.status === 201) {
        if (response.data.Success === false) {
          throw new Error(`Mocash: ${response.data.Message}`);
        }

        return {
          summa: response.data.Summa,
          success: response.data.Success,
          messageId: response.data.OperationId,
          message: response.data.Message,
        };
      }

      if (response.status === 401) {
        throw new Error("Mocash: Signature invalide (401)");
      }

      if (response.status === 403) {
        throw new Error("Mocash: Confirm invalide (403)");
      }

      throw new Error(
        `Mocash Error ${response.status}: ${JSON.stringify(response.data)}`,
      );
    } catch (error: any) {
      if (error.message?.includes("Mocash:")) {
        throw error;
      }
      throw new Error(`Erreur connexion Mocash: ${error.message}`);
    }
  }

  async checkCashdeskBalance(date?: Date): Promise<{
    balance: number | null;
    limit: number | null;
  }> {
    try {
      const dt = date
        ? this.formatDateForMocash(date)
        : this.formatDateForMocash(new Date());

      const { signature, confirm } = this.generateBalanceSignature(dt);

      const url = `${MOCASH_API_URL}/Cashdesk/${this.config.cashdeskid}/Balance?confirm=${confirm}&dt=${encodeURIComponent(dt)}`;

      const response = await axios({
        method: "GET",
        url: url,
        headers: {
          sign: signature,
        },
        timeout: 10000,
      });

      return {
        balance: response.data.Balance,
        limit: response.data.Limit,
      };
    } catch (error: any) {
      throw new Error("Impossible de vérifier le solde Mocash");
    }
  }

  async searchUser(userId: string): Promise<{
    currencyId: number;
    userId: number;
    name: string;
  }> {
    try {
      const { signature, confirm } = this.generateSearchSignature(userId);

      const url = `${MOCASH_API_URL}/Users/${userId}?confirm=${confirm}&cashdeskid=${this.config.cashdeskid}`;

      const response = await axios({
        method: "GET",
        url: url,
        headers: {
          sign: signature,
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Utilisateur 1xbet ${userId} introuvable`);
      }
      throw new Error("Erreur lors de la recherche utilisateur");
    }
  }

  private formatDateForMocash(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    const hours = String(date.getUTCHours()).padStart(2, "0");
    const minutes = String(date.getUTCMinutes()).padStart(2, "0");
    const seconds = String(date.getUTCSeconds()).padStart(2, "0");

    return `${year}.${month}.${day} ${hours}:${minutes}:${seconds}`;
  }
}

export const mocashClient = new MocashClient({
  hash: process.env.MOCASH_HASH!,
  cashdeskid: parseInt(process.env.MOCASH_CASHDESK_ID!),
  cashierpass: process.env.MOCASH_CASHIER_PASS!,
  ...(process.env.MOCASH_LOGIN && { login: process.env.MOCASH_LOGIN }),
});

export { MocashClient };

/**
 * FLOW D'UTILISATION DU CLIENT MOCASH
 * ====================================
 *
 * 1. INITIALISATION
 *    - Le client est créé automatiquement à l'import avec les credentials depuis .env
 *    - Validation des credentials obligatoires (hash, cashdeskid, cashierpass)
 *
 * 2. DEPOSIT (Crédit compte 1xbet)
 *    - Génération de la signature en 3 étapes :
 *      a) SHA256(hash + langue + userId)
 *      b) MD5(montant + cashierpass + cashdeskid)
 *      c) SHA256(résultat a + résultat b)
 *    - Génération du confirm : MD5(userId:hash)
 *    - Envoi requête POST vers /Deposit/{userId}/Add avec signature dans header
 *    - Réponse Mocash avec champs en MAJUSCULE (Summa, Success, Message, OperationId)
 *    - Mapping vers minuscules pour uniformité du code
 *    - Vérification de Success=false pour gérer les refus (ex: montant < 50 FCFA)
 *
 * 3. CHECK BALANCE (Vérification solde caisse)
 *    - Génération signature similaire mais avec date UTC au lieu de userId
 *    - Confirm basé sur cashdeskid au lieu de userId
 *    - Requête GET vers /Cashdesk/{cashdeskid}/Balance
 *    - Retourne le solde et la limite de la caisse
 *
 * 4. SEARCH USER (Recherche utilisateur 1xbet)
 *    - Signature avec userId + cashdeskid
 *    - Requête GET vers /Users/{userId}
 *    - Retourne les infos de l'utilisateur (nom, devise, etc.)
 *    - Erreur 404 si utilisateur n'existe pas
 *
 * 5. GESTION D'ERREURS
 *    - 401 : Signature invalide (credentials incorrects)
 *    - 403 : Confirm invalide (problème de calcul MD5)
 *    - 200 avec Success=false : Refus Mocash (montant invalide, etc.)
 *    - Autres : Erreurs réseau ou serveur
 *
 * CONTRAINTES MOCASH
 * ==================
 * - Montant minimum : 50 FCFA
 * - Timeout requêtes : 30 secondes (deposit), 10 secondes (autres)
 * - Format date : yyyy.MM.dd HH:mm:ss en UTC
 * - Tous les champs de réponse sont en MAJUSCULE (Summa, Success, Message)
 */
