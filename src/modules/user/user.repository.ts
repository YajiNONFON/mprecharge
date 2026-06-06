import { prisma } from "../../infrastructure/database/prisma";

export interface GetAllUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
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
}

// GET ALL — Raw SQL + search + filters

export const findAllUsers = async (params: GetAllUsersParams) => {
  const { page, limit, search, role, status } = params;
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

  if (status) {
    conditions.push(`u.is_active = $${idx}`);
    values.push(status === "active");
    idx++;
  }

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
      p."publicId"      AS public_id
    FROM "User" u
    LEFT JOIN "Profile" p ON p."userId" = u.id
    ${where}
    ORDER BY u.created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  const countQuery = `
    SELECT COUNT(*) AS total
    FROM "User" u
    LEFT JOIN "Profile" p ON p."userId" = u.id
    ${where}
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
