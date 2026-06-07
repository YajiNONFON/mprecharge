import { PointTxType, ReferralStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../infrastructure/database/prisma";

export interface GetMyReferralsParams {
  userId: string;
  page: number;
  limit: number;
}

export interface GetAllReferralsParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}

export interface GetPointHistoryParams {
  userId: string;
  page: number;
  limit: number;
}

// REFERRAL CODE

export const findUserByReferralCode = async (referralCode: string) => {
  return prisma.user.findUnique({
    where: { referralCode },
    select: { id: true, referralCode: true, pointsBalance: true },
  });
};

// REFERRAL

export const findReferralByReferredId = async (referredId: string) => {
  return prisma.referral.findFirst({
    where: { referredId },
    include: {
      referrer: {
        select: { id: true, pointsBalance: true, referralCode: true },
      },
    },
  });
};

export const findReferralsByReferrerId = async (referrerId: string) => {
  return prisma.referral.findMany({
    where: { referrerId },
    include: {
      referred: {
        select: { first_name: true, last_name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const createReferral = async (
  referrerId: string,
  referredId: string,
) => {
  return prisma.referral.create({
    data: {
      referrerId,
      referredId,
      status: ReferralStatus.PENDING,
    },
  });
};

export const validateReferral = async (referralId: string) => {
  return prisma.referral.update({
    where: { id: referralId },
    data: {
      status: ReferralStatus.VALIDATED,
      validatedAt: new Date(),
    },
  });
};

// PAGINATION USER — ses filleuls

export const findReferralsByReferrerIdPaginated = async (
  params: GetMyReferralsParams,
) => {
  const { userId, page, limit } = params;
  const offset = (page - 1) * limit;

  const [referrals, total] = await Promise.all([
    prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: { first_name: true, last_name: true, created_at: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.referral.count({ where: { referrerId: userId } }),
  ]);

  return {
    referrals,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

// PAGINATION ADMIN — tous les parrainages

export const findAllReferralsPaginated = async (
  params: GetAllReferralsParams,
) => {
  const { page, limit, search, status } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(
      CONCAT(referrer.first_name, ' ', referrer.last_name) ILIKE $${idx}
      OR CONCAT(referred.first_name, ' ', referred.last_name) ILIKE $${idx}
      OR referrer.email ILIKE $${idx}
      OR referred.email ILIKE $${idx}
    )`);
    values.push(`%${search}%`);
    idx++;
  }

  if (status) {
    conditions.push(`r.status = $${idx}`);
    values.push(status.toUpperCase());
    idx++;
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    SELECT
      r.id,
      r."referrerId",
      r."referredId",
      r.status,
      r."createdAt",
      r."validatedAt",
      CONCAT(referrer.first_name, ' ', referrer.last_name) AS referrer_name,
      referrer.email                                        AS referrer_email,
      referrer."pointsBalance"                              AS referrer_points,
      CONCAT(referred.first_name, ' ', referred.last_name) AS referred_name,
      referred.email                                        AS referred_email
    FROM "Referral" r
    LEFT JOIN "User" referrer ON referrer.id = r."referrerId"
    LEFT JOIN "User" referred ON referred.id = r."referredId"
    ${where}
    ORDER BY r."createdAt" DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM "Referral" r
    LEFT JOIN "User" referrer ON referrer.id = r."referrerId"
    LEFT JOIN "User" referred ON referred.id = r."referredId"
    ${where}
  `;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(dataQuery, ...values, limit, offset),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(countQuery, ...values),
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  return {
    referrals: rows,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

// POINTS

export const createPointTransaction = async (data: {
  userId: string;
  type: PointTxType;
  points: number;
  referralId?: string;
  transactionId?: string;
  payoutId?: string;
}) => {
  return prisma.pointTransaction.create({ data });
};

export const updateUserPointsBalance = async (
  userId: string,
  points: number,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { pointsBalance: { increment: points } },
  });
};

export const resetUserPointsBalance = async (userId: string) => {
  return prisma.user.update({
    where: { id: userId },
    data: { pointsBalance: 0 },
  });
};

export const getTotalPointsEarned = async (userId: string) => {
  const result = await prisma.pointTransaction.aggregate({
    where: {
      userId,
      type: { in: [PointTxType.EARN, PointTxType.WELCOME] },
    },
    _sum: { points: true },
  });
  return result._sum.points ?? 0;
};

// PAGINATION USER — historique des points

export const findPointHistoryPaginated = async (
  params: GetPointHistoryParams,
) => {
  const { userId, page, limit } = params;
  const offset = (page - 1) * limit;

  const [history, total] = await Promise.all([
    prisma.pointTransaction.findMany({
      where: { userId },
      include: {
        referral: {
          include: {
            referred: {
              select: { first_name: true, last_name: true },
            },
          },
        },
        transaction: {
          select: { amount: true, type: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.pointTransaction.count({ where: { userId } }),
  ]);

  return {
    history,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

export const findPointHistoryByUserId = async (userId: string) => {
  return prisma.pointTransaction.findMany({
    where: { userId },
    include: {
      referral: {
        include: {
          referred: {
            select: { first_name: true, last_name: true },
          },
        },
      },
      transaction: {
        select: { amount: true, type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// CUMUL TRANSACTIONS FILLEUL

export const getFilleulTransactionCumul = async (
  filleulId: string,
): Promise<number> => {
  const result = await prisma.transaction.aggregate({
    where: {
      userId: filleulId,
      status: "SUCCESS",
    },
    _sum: { amount: true },
  });
  return result._sum.amount ?? 0;
};

// PAYOUT

export const createReferralPayout = async (data: {
  userId: string;
  pointsConverted: number;
  amountPaid: number;
  paidByAdminId: string;
}) => {
  return prisma.referralPayout.create({ data });
};

export const findPayoutsByUserId = async (userId: string) => {
  return prisma.referralPayout.findMany({
    where: { userId },
    orderBy: { paidAt: "desc" },
  });
};

export const findAllPayouts = async () => {
  return prisma.referralPayout.findMany({
    include: {
      user: {
        select: { first_name: true, last_name: true, email: true },
      },
    },
    orderBy: { paidAt: "desc" },
  });
};

// CONFIG — TAUX DE CONVERSION

const CONVERSION_RATE_KEY = "conversion_rate";

export const getConversionRate = async (): Promise<number> => {
  const config = await prisma.config.findUnique({
    where: { key: CONVERSION_RATE_KEY },
  });
  return config ? parseFloat(config.value) : 1;
};

export const updateConversionRate = async (rate: number) => {
  return prisma.config.upsert({
    where: { key: CONVERSION_RATE_KEY },
    update: { value: rate.toString() },
    create: { key: CONVERSION_RATE_KEY, value: rate.toString() },
  });
};

// ADMIN STATS

export const getReferralAdminStats = async () => {
  const [
    totalReferrals,
    validatedReferrals,
    pendingReferrals,
    totalPointsDistributed,
    totalPayoutsAgg,
  ] = await Promise.all([
    prisma.referral.count(),
    prisma.referral.count({ where: { status: ReferralStatus.VALIDATED } }),
    prisma.referral.count({ where: { status: ReferralStatus.PENDING } }),
    prisma.pointTransaction.aggregate({
      where: { type: { in: [PointTxType.EARN, PointTxType.WELCOME] } },
      _sum: { points: true },
    }),
    prisma.referralPayout.aggregate({
      _sum: { amountPaid: true },
      _count: true,
    }),
  ]);

  return {
    totalReferrals,
    validatedReferrals,
    pendingReferrals,
    totalPointsDistributed: totalPointsDistributed._sum.points ?? 0,
    totalPayouts: totalPayoutsAgg._count,
    totalAmountPaid: totalPayoutsAgg._sum.amountPaid ?? 0,
  };
};
