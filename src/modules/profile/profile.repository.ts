import { prisma } from "../../infrastructure/database/prisma";

// GET

export const findProfileByUserId = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
};

// UPDATE

export const updateUserInfo = async (
  userId: string,
  data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  },
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { ...data, updated_at: new Date() },
  });
};

export const updateProfileInfo = async (
  userId: string,
  data: {
    oneXbetId?: string;
    platformAccountId?: string;
    activeServiceId?: string;
    mtnNumber?: string;
    moovNumber?: string;
    celtiisNumber?: string;
    orangeNumber?: string;
    profileImage?: string;
  },
) => {
  return prisma.profile.update({
    where: { userId },
    data: { ...data, updated_at: new Date() },
  });
};

export const updateUserPassword = async (
  userId: string,
  password_hash: string,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password_hash, updated_at: new Date() },
  });
};

// REFERRAL CODE

export const findUserReferralCode = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
};

export const saveReferralCode = async (
  userId: string,
  referralCode: string,
) => {
  return prisma.user.update({
    where: { id: userId },
    data: { referralCode },
  });
};

// REFERRALS

export const findReferralsByUserId = async (userId: string) => {
  return prisma.referral.findMany({
    where: { referrerId: userId },
    include: {
      referred: {
        select: { first_name: true, last_name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};
