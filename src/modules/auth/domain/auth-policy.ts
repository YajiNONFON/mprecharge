import { Role } from "../../../../generated/prisma/enums";

const SUPER_ADMIN_EMAIL = "eliassoglohoun@gmail.com";
const ADMIN_DEV_EMAIL = "sonagnonnonfon@gmail.com";
const ADMIN_PREFIX = "pro@";

export const resolveRole = (email: string, first_name: string): Role => {
  if (email === SUPER_ADMIN_EMAIL) return Role.SUPER_ADMIN;
  if (email === ADMIN_DEV_EMAIL) return Role.ADMIN_DEV;
  if (first_name.startsWith(ADMIN_PREFIX)) return Role.ADMIN;
  return Role.CLIENT;
};

export const isRateLimited = (lastRequestAt: Date): boolean => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  return lastRequestAt > oneMinuteAgo;
};

export const isTokenExpired = (expiresAt: Date): boolean => {
  return expiresAt < new Date();
};

export const isSessionValid = (expiresAt: Date): boolean => {
  return expiresAt > new Date();
};
