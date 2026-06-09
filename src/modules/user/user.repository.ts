import { prisma } from "../../infrastructure/database/prisma";

export interface GetAllUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
  filter?: "best" | "at_risk" | "blocked";
}

export interface UserRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  public_id: string | null;
  referral_code: string | null;
  points_balance: number;
  // stats transactions
  success_count: number;
  failed_count: number;
  pending_count: number;
}

// GET ALL — Raw SQL + search + filters + stats

export const findAllUsers = async (params: GetAllUsersParams) => {
  const { page, limit, search, role, status, filter } = params;
  const offset = (page - 1) * limit;

  const conditions: string[] = [`u.role NOT IN ('SUPER_ADMIN', 'ADMIN_DEV')`];
  const values: any[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(
      u.first_name ILIKE $${idx}
      OR u.last_name ILIKE $${idx}
      OR u.email ILIKE $${idx}
      OR u.phone ILIKE $${idx}
      OR p."publicId" ILIKE $${idx}
      OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $${idx}
    )`);
    values.push(`%${search}%`);
    idx++;
  }

  if (role) {
    conditions.push(`u.role = $${idx}`);
    values.push(role.toUpperCase());
    idx++;
  }

  // filter "blocked" → is_active = false
  if (filter === "blocked") {
    conditions.push(`u.is_active = false`);
  } else if (status) {
    conditions.push(`u.is_active = $${idx}`);
    values.push(status === "active");
    idx++;
  }

  // filter "at_risk" → au moins 1 transaction et ratio échecs > 50%
  // géré via HAVING après le GROUP BY dans la query principale
  const atRiskHaving =
    filter === "at_risk"
      ? `HAVING
          COUNT(t.id) > 0
          AND (
            COUNT(t.id) FILTER (WHERE t.status = 'FAILED')::float
            / COUNT(t.id)::float
          ) > 0.5`
      : "";

  // filter "best" → ORDER BY volume total DESC
  const orderBy =
    filter === "best"
      ? `ORDER BY COALESCE(SUM(t.amount) FILTER (WHERE t.status = 'SUCCESS'), 0) DESC`
      : `ORDER BY u.created_at DESC`;

  const where = `WHERE ${conditions.join(" AND ")}`;

  const dataQuery = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      u.role,
      u.is_active,
      u.created_at,
      u."referralCode"  AS referral_code,
      u."pointsBalance" AS points_balance,
      p."publicId"      AS public_id,
      COUNT(t.id) FILTER (WHERE t.status = 'SUCCESS')::int AS success_count,
      COUNT(t.id) FILTER (WHERE t.status = 'FAILED')::int  AS failed_count,
      COUNT(t.id) FILTER (WHERE t.status = 'PENDING')::int AS pending_count
    FROM "User" u
    LEFT JOIN "Profile" p ON p."userId" = u.id
    LEFT JOIN "Transaction" t ON t."userId" = u.id
    ${where}
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone,
             u.role, u.is_active, u.created_at, u."referralCode",
             u."pointsBalance", p."publicId"
    ${atRiskHaving}
    ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total FROM (
      SELECT u.id
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      LEFT JOIN "Transaction" t ON t."userId" = u.id
      ${where}
      GROUP BY u.id
      ${atRiskHaving}
    ) sub
  `;

  const [rows, countResult] = await Promise.all([
    prisma.$queryRawUnsafe<UserRow[]>(dataQuery, ...values, limit, offset),
    prisma.$queryRawUnsafe<{ total: bigint }[]>(countQuery, ...values),
  ]);

  const total = Number(countResult[0]?.total ?? 0);

  return {
    users: rows,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

// GET BY ID

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });
};

// SOFT DELETE

export const softDeleteUser = async (id: string) => {
  return prisma.user.update({
    where: { id },
    data: { is_active: false, updated_at: new Date() },
  });
};

// TOGGLE STATUS

export const toggleUserStatus = async (id: string, is_active: boolean) => {
  return prisma.user.update({
    where: { id },
    data: { is_active, updated_at: new Date() },
  });
};
