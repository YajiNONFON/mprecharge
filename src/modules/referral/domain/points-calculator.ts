import {
  calculatePointsForParrain,
  getWelcomePoints,
  convertPointsToFcfa,
  hasReachedPayoutThreshold,
  PAYOUT_THRESHOLD,
} from "./referral.entity";

// CALCUL POINTS PARRAIN SUR TRANSACTION

/**
 * Calcule les points à attribuer au parrain
 * après une nouvelle transaction d'un filleul
 *
 * @param previousCumulAmount - cumul des transactions du filleul AVANT cette transaction
 * @param newTransactionAmount - montant de la nouvelle transaction
 * @returns nombre de points à attribuer au parrain (peut être 0)
 */
export const computeParrainPoints = (
  previousCumulAmount: number,
  newTransactionAmount: number,
): number => {
  return calculatePointsForParrain(previousCumulAmount, newTransactionAmount);
};

// POINTS BIENVENUE FILLEUL

/**
 * Retourne les points de bienvenue à attribuer au filleul
 * lors de son inscription avec un code de parrainage valide
 */
export const computeWelcomePoints = (): number => {
  return getWelcomePoints();
};

// MONTANT PAYOUT

/**
 * Calcule le montant en FCFA à verser au parrain
 * selon le nombre de points et le taux de conversion global
 *
 * @param points - nombre de points à convertir
 * @param conversionRate - taux global (1 point = X FCFA)
 */
export const computePayoutAmount = (
  points: number,
  conversionRate: number,
): number => {
  return convertPointsToFcfa(points, conversionRate);
};

// VÉRIFICATION ÉLIGIBILITÉ PAYOUT

/**
 * Vérifie si le parrain est éligible au payout
 * et retourne les infos nécessaires
 */
export interface PayoutEligibility {
  isEligible: boolean;
  pointsBalance: number;
  pointsNeeded: number;
  estimatedAmount: number;
}

export const checkPayoutEligibility = (
  pointsBalance: number,
  conversionRate: number,
): PayoutEligibility => {
  const isEligible = hasReachedPayoutThreshold(pointsBalance);
  const pointsNeeded = isEligible ? 0 : PAYOUT_THRESHOLD - pointsBalance;
  const estimatedAmount = computePayoutAmount(pointsBalance, conversionRate);

  return {
    isEligible,
    pointsBalance,
    pointsNeeded,
    estimatedAmount,
  };
};

// CUMUL TRANSACTIONS FILLEULS

/**
 * Calcule le total des points qu'un parrain devrait avoir
 * basé sur le volume total de transactions de ses filleuls
 * Utile pour les vérifications et audits
 *
 * @param totalVolume - volume total FCFA de tous les filleuls
 */
export const computeTotalExpectedPoints = (totalVolume: number): number => {
  const tranches = Math.floor(totalVolume / 1000);
  return tranches * 5;
};
