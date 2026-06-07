import {
  findUserByReferralCode,
  findReferralByReferredId,
  findReferralsByReferrerId,
  createReferral,
  createPointTransaction,
  updateUserPointsBalance,
  resetUserPointsBalance,
  findPointHistoryByUserId,
  getTotalPointsEarned,
  getFilleulTransactionCumul,
  createReferralPayout,
  getConversionRate,
  updateConversionRate,
  getReferralAdminStats,
  GetAllReferralsParams,
  findAllReferralsPaginated,
  findReferralsByReferrerIdPaginated,
  findPointHistoryPaginated,
} from "./referral.repository";
import {
  computeWelcomePoints,
  computeParrainPoints,
  computePayoutAmount,
  checkPayoutEligibility,
} from "./domain/points-calculator";
import { isValidReferralCode } from "./domain/referral.entity";
import type {
  CreatePayoutDtoType,
  UpdateConversionRateDtoType,
} from "./referral.dto";
import type {
  ReferralStats,
  AdminReferralStats,
  ConversionRate,
} from "./referral.types";
import {
  BadRequestException,
  NotFoundException,
} from "../../shared/errors/http-errors";
import { PointTxType } from "../../../generated/prisma/enums";

// REGISTER HOOK

export const handleReferralOnRegister = async (
  newUserId: string,
  referralCode: string,
): Promise<void> => {
  if (!isValidReferralCode(referralCode)) {
    throw new BadRequestException("Code de parrainage invalide.");
  }

  const referrer = await findUserByReferralCode(referralCode);

  if (!referrer) {
    throw new NotFoundException("Code de parrainage introuvable.");
  }

  if (referrer.id === newUserId) {
    throw new BadRequestException(
      "Vous ne pouvez pas vous parrainer vous-même.",
    );
  }

  const existing = await findReferralByReferredId(newUserId);

  if (existing) {
    throw new BadRequestException("Cet utilisateur a déjà été parrainé.");
  }

  const referral = await createReferral(referrer.id, newUserId);

  const welcomePoints = computeWelcomePoints();

  await updateUserPointsBalance(newUserId, welcomePoints);
  await createPointTransaction({
    userId: newUserId,
    type: PointTxType.WELCOME,
    points: welcomePoints,
    referralId: referral.id,
  });
};

// TRANSACTION HOOK

export const handlePointsOnTransaction = async (
  filleulId: string,
  transactionId: string,
  transactionAmount: number,
): Promise<void> => {
  const referral = await findReferralByReferredId(filleulId);

  if (!referral) return;

  const currentCumul = await getFilleulTransactionCumul(filleulId);
  const previousCumulBeforeTx = currentCumul - transactionAmount;

  const pointsToAward = computeParrainPoints(
    previousCumulBeforeTx,
    transactionAmount,
  );

  if (pointsToAward <= 0) return;

  const referrerId = referral.referrerId;

  await updateUserPointsBalance(referrerId, pointsToAward);
  await createPointTransaction({
    userId: referrerId,
    type: PointTxType.EARN,
    points: pointsToAward,
    referralId: referral.id,
    transactionId,
  });

  // Vérification seuil 500 points — notification parrain
  const updatedReferrer = await findUserByReferralCode(
    referral.referrer.referralCode ?? "",
  );

  if (
    updatedReferrer &&
    updatedReferrer.pointsBalance >= 500 &&
    updatedReferrer.pointsBalance - pointsToAward < 500
  ) {
    // Le parrain vient exactement de franchir le seuil → notifier
    // Import dynamique pour éviter circular dependency
    const { sendNotificationOnly } =
      await import("../notification/notification.service");
    await sendNotificationOnly(
      referrerId,
      "🎉 Vous êtes éligible au payout !",
      `Félicitations ! Vous avez atteint ${updatedReferrer.pointsBalance} points. Contactez l'administrateur pour recevoir votre paiement.`,
      "SUCCESS",
      "system",
    );
  }
};

// STATS PARRAIN

export const getMyReferralStats = async (
  userId: string,
  page: number = 1,
  limit: number = 10,
): Promise<ReferralStats> => {
  const [
    { referrals, total, totalPages, currentPage },
    pointHistoryResult,
    totalPointsEarned,
    conversionRate,
  ] = await Promise.all([
    findReferralsByReferrerIdPaginated({ userId, page, limit }),
    findPointHistoryPaginated({ userId, page, limit }),
    getTotalPointsEarned(userId),
    getConversionRate(),
  ]);

  const totalTransactionVolume = await Promise.all(
    referrals.map((r) => getFilleulTransactionCumul(r.referredId)),
  ).then((amounts) => amounts.reduce((sum, a) => sum + a, 0));

  const totalConverted = pointHistoryResult.history
    .filter((p) => p.type === PointTxType.CONVERT)
    .reduce((sum, p) => sum + p.points, 0);

  const pointsBalance = totalPointsEarned - Math.abs(totalConverted);
  const eligibility = checkPayoutEligibility(pointsBalance, conversionRate);

  const validatedFilleuls = referrals.filter(
    (r) => r.status === "VALIDATED",
  ).length;
  const pendingFilleuls = referrals.filter(
    (r) => r.status === "PENDING",
  ).length;

  return {
    referralCode: null,
    pointsBalance,
    totalPointsEarned,
    totalFilleuls: total,
    validatedFilleuls,
    pendingFilleuls,
    totalTransactionVolume,
    isEligibleForPayout: eligibility.isEligible,
    estimatedPayout: eligibility.estimatedAmount,
    pagination: {
      totalPages,
      currentPage,
      total,
    },
    referrals: referrals.map((r) => ({
      id: r.id,
      referrerId: r.referrerId,
      referredId: r.referredId,
      referredName: `${r.referred.first_name} ${r.referred.last_name}`.trim(),
      status: r.status,
      createdAt: r.createdAt,
      validatedAt: r.validatedAt,
    })),
    pointHistory: pointHistoryResult.history.map((p) => ({
      id: p.id,
      type: p.type,
      points: p.points,
      referredName: p.referral?.referred
        ? `${p.referral.referred.first_name} ${p.referral.referred.last_name}`.trim()
        : null,
      transactionAmount: p.transaction?.amount ?? null,
      createdAt: p.createdAt,
    })),
  };
};

// ADMIN

export const getAllReferrals = async (
  params: GetAllReferralsParams,
): Promise<AdminReferralStats> => {
  const stats = await getReferralAdminStats();
  const { referrals, total, totalPages, currentPage } =
    await findAllReferralsPaginated(params);

  return {
    ...stats,
    pagination: { total, totalPages, currentPage },
    referrals: referrals.map((r: any) => ({
      id: r.id,
      referrerId: r.referrerid,
      referredId: r.referredid,
      referredName: r.referred_name,
      referrerName: r.referrer_name,
      referrerEmail: r.referrer_email,
      referrerPoints: r.referrer_points,
      status: r.status,
      createdAt: r.createdat,
      validatedAt: r.validatedat,
    })),
  };
};

export const createPayout = async (
  data: CreatePayoutDtoType,
  adminId: string,
): Promise<{ amountPaid: number; pointsConverted: number }> => {
  const { userId, pointsToConvert } = data;

  const conversionRate = await getConversionRate();
  const amountPaid = computePayoutAmount(pointsToConvert, conversionRate);

  const payout = await createReferralPayout({
    userId,
    pointsConverted: pointsToConvert,
    amountPaid,
    paidByAdminId: adminId,
  });

  await resetUserPointsBalance(userId);

  await createPointTransaction({
    userId,
    type: PointTxType.CONVERT,
    points: -pointsToConvert,
    payoutId: payout.id,
  });

  return { amountPaid, pointsConverted: pointsToConvert };
};

export const getConversionRateService = async (): Promise<ConversionRate> => {
  const rate = await getConversionRate();
  return { rate, updatedAt: new Date() };
};

export const updateConversionRateService = async (
  data: UpdateConversionRateDtoType,
): Promise<ConversionRate> => {
  const updated = await updateConversionRate(data.rate);
  return { rate: parseFloat(updated.value), updatedAt: updated.updatedAt };
};
