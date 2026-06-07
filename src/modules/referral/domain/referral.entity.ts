// ─────────────────────────────────────────
// CONSTANTES
// ─────────────────────────────────────────

export const POINTS_PER_1000_FCFA = 5; // 1000 FCFA = 5 points
export const WELCOME_POINTS = 20; // points offerts au filleul
export const PAYOUT_THRESHOLD = 500; // seuil minimum pour payout
export const DEFAULT_CONVERSION_RATE = 1; // 1 point = 1 FCFA par défaut
export const TRANSACTION_UNIT = 1000; // unité de calcul en FCFA

// CALCUL DES POINTS PARRAIN

/**
 * Calcule les points à attribuer au parrain
 * selon le cumul des transactions de ses filleuls
 *
 * Logique : chaque tranche de 1000 FCFA = 5 points
 *
 * Exemple :
 * - previousTotal = 800 FCFA, newAmount = 500 FCFA
 * - newTotal = 1300 FCFA
 * - tranchesBefore = floor(800 / 1000) = 0
 * - tranchesAfter  = floor(1300 / 1000) = 1
 * - pointsToAward  = (1 - 0) × 5 = 5 points
 */
export const calculatePointsForParrain = (
  previousCumulAmount: number,
  newTransactionAmount: number,
): number => {
  const newCumulAmount = previousCumulAmount + newTransactionAmount;

  const tranchesBefore = Math.floor(previousCumulAmount / TRANSACTION_UNIT);
  const tranchesAfter = Math.floor(newCumulAmount / TRANSACTION_UNIT);

  const newTranches = tranchesAfter - tranchesBefore;

  return newTranches * POINTS_PER_1000_FCFA;
};

// POINTS BIENVENUE

/**
 * Retourne les points de bienvenue fixes
 * attribués au filleul à l'inscription
 */
export const getWelcomePoints = (): number => {
  return WELCOME_POINTS;
};

// SEUIL PAYOUT

/**
 * Vérifie si le parrain est éligible au payout
 */
export const hasReachedPayoutThreshold = (pointsBalance: number): boolean => {
  return pointsBalance >= PAYOUT_THRESHOLD;
};

// CONVERSION POINTS → FCFA

/**
 * Convertit des points en FCFA selon le taux global
 *
 * Exemple avec taux = 1 : 500 points = 500 FCFA
 * Exemple avec taux = 2 : 500 points = 1000 FCFA
 */
export const convertPointsToFcfa = (
  points: number,
  conversionRate: number = DEFAULT_CONVERSION_RATE,
): number => {
  return points * conversionRate;
};

// VALIDATION CODE PARRAINAGE

/**
 * Vérifie le format du code parrainage
 * Format attendu : REF-XXXXXX (6 caractères alphanumériques majuscules)
 */
export const isValidReferralCode = (code: string): boolean => {
  return /^MPAY-[A-Z0-9]{6}$/.test(code);
};
