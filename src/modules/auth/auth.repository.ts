import { addDays, addMinutes } from "date-fns";
import { prisma } from "../../infrastructure/database/prisma";
import { Role } from "../../../generated/prisma/enums";

// ─────────────────────────────────────────
// USER
// ─────────────────────────────────────────

export const findUserByEmail = async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
};

export const findUserById = async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
};

export const createUser = async (data: {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password_hash: string;
  role: Role;
  acceptTerms: boolean;
  referralCode?: string;
  publicId: string;
  deviceName?: string;
  ipAddress?: string;
}) => {
  const { publicId, deviceName, ipAddress, ...userData } = data;

  return prisma.user.create({
    data: {
      ...userData,
      profile: {
        create: { publicId },
      },
    },
    include: { profile: true },
  });
};

export const updateUserPassword = async (
  userId: string,
  password_hash: string,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password_hash },
  });
};

// ─────────────────────────────────────────
// SESSION
// ─────────────────────────────────────────

export const createSession = async (data: {
  userId: string;
  refreshToken: string;
  deviceName?: string;
  ipAddress?: string;
  expiresAt: Date;
}) => {
  return prisma.userSession.create({
    data: {
      userId: data.userId,
      refreshToken: data.refreshToken,
      device: data.deviceName || "unknown",
      ipAddress: data.ipAddress || null,
      expiresAt: data.expiresAt,
    },
  });
};

export const findSessionByRefreshToken = async (refreshToken: string) => {
  return prisma.userSession.findUnique({
    where: { refreshToken },
    include: { user: true },
  });
};

export const deleteSessionByRefreshToken = async (refreshToken: string) => {
  return prisma.userSession.deleteMany({ where: { refreshToken } });
};

export const updateSessionLastUsed = async (sessionId: string) => {
  return prisma.userSession.update({
    where: { id: sessionId },
    data: { lastUsedAt: new Date() },
  });
};

// ─────────────────────────────────────────
// PASSWORD RESET TOKEN
// ─────────────────────────────────────────

export const findRecentResetRequest = async (userId: string) => {
  return prisma.passwordResetToken.findFirst({
    where: {
      userId,
      created_at: { gte: new Date(Date.now() - 60 * 1000) },
    },
  });
};

export const deleteAllResetTokens = async (userId: string) => {
  return prisma.passwordResetToken.deleteMany({ where: { userId } });
};

export const createResetToken = async (userId: string, hashed: string) => {
  return prisma.passwordResetToken.create({
    data: {
      userId,
      hashed_token: hashed,
      expires_at: addMinutes(new Date(), 10),
    },
  });
};

export const findLatestResetToken = async (userId: string) => {
  return prisma.passwordResetToken.findFirst({
    where: { userId },
    orderBy: { created_at: "desc" },
  });
};

export const markResetTokenAsUsed = async (tokenId: string) => {
  return prisma.passwordResetToken.update({
    where: { id: tokenId },
    data: { used: true },
  });
};
