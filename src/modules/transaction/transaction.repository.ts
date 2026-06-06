import { TransactionsStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../infrastructure/database/prisma";

export interface GetAllTransactionsParams {
  page: number;
  limit: number;
  type?: string;
  service?: string;
  status?: string;
}

// USER TRANSACTIONS

export const findTransactionsByUserId = async (userId: string) => {
  return prisma.transaction.findMany({
    where: { userId },
    orderBy: { created_at: "desc" },
    include: {
      service: { select: { name: true, displayName: true } },
    },
  });
};

export const findTransactionByIdAndUserId = async (
  transactionId: string,
  userId: string,
) => {
  return prisma.transaction.findFirst({
    where: { id: transactionId, userId },
    include: {
      service: { select: { name: true, displayName: true } },
    },
  });
};

// ADMIN TRANSACTIONS — Raw SQL + filters

export const findAllTransactions = async (params: GetAllTransactionsParams) => {
  const { page, limit, type, service, status } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (type && type !== "tous") {
    conditions.push(`t.type = $${idx}`);
    values.push(type.toUpperCase());
    idx++;
  }

  if (service && service !== "tous") {
    conditions.push(`s.name = $${idx}`);
    values.push(service);
    idx++;
  }

  if (status && status !== "tous") {
    conditions.push(`t.status = $${idx}`);
    values.push(status.toUpperCase());
    idx++;
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const dataQuery = `
    SELECT
      t.id,
      t."transpublicId",
      t.amount,
      t."netAmount",
      t.fees,
      t.type,
      t.status,
      t."networkType",
      t."paymentNumber",
      t."accountId",
      t."clientFullName",
      t."providerRef",
      t.created_at,
      t.updated_at,
      s.name        AS service_name,
      s."displayName" AS service_display_name,
      u.first_name,
      u.last_name
    FROM "Transaction" t
    LEFT JOIN "Service" s ON s.id = t."serviceId"
    LEFT JOIN "User"    u ON u.id = t."userId"
    ${where}
    ORDER BY t.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM "Transaction" t
    LEFT JOIN "Service" s ON s.id = t."serviceId"
    LEFT JOIN "User"    u ON u.id = t."userId"
    ${where}
  `;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<any[]>(dataQuery, ...values, limit, offset),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(countQuery, ...values),
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  return {
    transactions: rows,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

// UPDATE STATUS

export const findTransactionById = async (id: string) => {
  return prisma.transaction.findUnique({ where: { id } });
};

export const updateTransactionStatus = async (
  id: string,
  status: TransactionsStatus,
) => {
  return prisma.transaction.update({
    where: { id },
    data: { status, updated_at: new Date() },
  });
};
