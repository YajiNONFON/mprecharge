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

// CHART DATA
// Retourne les dépôts et retraits agrégés par slot temporel
// period=day   → slots par heure (0h-23h)
// period=week  → slots par jour (Lun-Dim)
// period=month → slots par jour du mois (1-31)
// period=year  → slots par mois (Jan-Déc)

export interface ChartSlot {
  label: string;
  deposits: number;
  withdrawals: number;
}

export const fetchChartData = async (period: string): Promise<ChartSlot[]> => {
  const startDate = getStartDate(period);

  // Truncation PostgreSQL selon la période
  const trunc =
    period === "day"
      ? "hour"
      : period === "week" || period === "month"
        ? "day"
        : "month";

  const rows = await prisma.$queryRawUnsafe<
    { slot: Date; type: string; total: number }[]
  >(
    `
    SELECT
      DATE_TRUNC($1, created_at) AS slot,
      type,
      COALESCE(SUM(amount), 0)::float AS total
    FROM "Transaction"
    WHERE created_at >= $2
    GROUP BY slot, type
    ORDER BY slot ASC
    `,
    trunc,
    startDate,
  );

  // Regrouper par slot
  const map = new Map<string, ChartSlot>();

  for (const row of rows) {
    const label = formatSlotLabel(new Date(row.slot), period);
    if (!map.has(label)) {
      map.set(label, { label, deposits: 0, withdrawals: 0 });
    }
    const slot = map.get(label)!;
    if (row.type === "DEPOSIT") slot.deposits = row.total;
    if (row.type === "WITHDRAWAL") slot.withdrawals = row.total;
  }

  return Array.from(map.values());
};

const formatSlotLabel = (date: Date, period: string): string => {
  if (period === "day") {
    const h = date.getHours().toString().padStart(2, "0");
    return `${h}h`;
  }
  if (period === "week") {
    return date.toLocaleDateString("fr-FR", { weekday: "short" });
  }
  if (period === "month") {
    return date.getDate().toString();
  }
  // year
  return date.toLocaleDateString("fr-FR", { month: "short" });
};

// PEAK HOURS
// Retourne le nombre de transactions par créneau de 2h
// sur les 30 derniers jours

export interface PeakSlot {
  slot: string; // ex: "08h-10h"
  count: number;
}

export const fetchPeakHours = async (): Promise<PeakSlot[]> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await prisma.$queryRawUnsafe<
    { hour_slot: number; count: number }[]
  >(
    `
    SELECT
      (EXTRACT(HOUR FROM created_at)::int / 2) * 2 AS hour_slot,
      COUNT(*)::int AS count
    FROM "Transaction"
    WHERE created_at >= $1
    GROUP BY hour_slot
    ORDER BY hour_slot ASC
    `,
    thirtyDaysAgo,
  );

  return rows.map((r) => ({
    slot: `${r.hour_slot.toString().padStart(2, "0")}h-${(r.hour_slot + 2).toString().padStart(2, "0")}h`,
    count: r.count,
  }));
};
