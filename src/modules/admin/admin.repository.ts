import { prisma } from "../../infrastructure/database/prisma";

export interface AdminStatsParams {
  period: "day" | "week" | "month" | "year";
}

export const getStartDate = (period: string): Date => {
  const now = new Date();
  switch (period) {
    case "week":
      return new Date(now.setDate(now.getDate() - 7));
    case "month":
      return new Date(now.setMonth(now.getMonth() - 1));
    case "year":
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case "day":
    default:
      return new Date(now.setHours(0, 0, 0, 0));
  }
};

export const fetchAdminStats = async (startDate: Date) => {
  const [
    totalUsers,
    activeUsers,
    totalAdmins,
    pendingTransaction,
    totalDepositsAgg,
    pendingAmountAgg,
    totalWithdrawalsAgg,
  ] = await Promise.all([
    prisma.user.count({
      where: {
        created_at: { gte: startDate },
        NOT: { role: { in: ["SUPER_ADMIN", "ADMIN_DEV", "ADMIN"] } },
      },
    }),
    prisma.user.count({
      where: {
        is_active: true,
        created_at: { gte: startDate },
        NOT: { role: { in: ["SUPER_ADMIN", "ADMIN_DEV", "ADMIN"] } },
      },
    }),
    prisma.user.count({
      where: {
        role: "ADMIN",
        created_at: { gte: startDate },
      },
    }),
    prisma.transaction.count({
      where: {
        status: "PENDING",
        created_at: { gte: startDate },
      },
    }),
    prisma.transaction.aggregate({
      where: { type: "DEPOSIT", created_at: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: "PENDING", created_at: { gte: startDate } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { type: "WITHDRAWAL", created_at: { gte: startDate } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalUsers,
    activeUsers,
    totalAdmins,
    pendingTransaction,
    totalDeposits: totalDepositsAgg._sum.amount ?? 0,
    totalPendingAmount: pendingAmountAgg._sum.amount ?? 0,
    totalWithdrawals: totalWithdrawalsAgg._sum.amount ?? 0,
  };
};
