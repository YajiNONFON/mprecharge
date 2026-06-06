import bcrypt from "bcryptjs";
import * as ProfileRepository from "./profile.repository";
import type {
  UpdateProfileDtoType,
  UpdatePasswordDtoType,
} from "./profile.dto";
import type { ProfileResponse, ReferralSummary } from "./profile.types";
import {
  BadRequestException,
  NotFoundException,
} from "../../shared/errors/http-errors";
import { generateUniquePublicId } from "../../shared/utils/generatePublicId";

// GET PROFILE

export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  const user = await ProfileRepository.findProfileByUserId(userId);

  if (!user) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    referralCode: user.referralCode,
    pointsBalance: user.pointsBalance,
    profileImage: user.profile?.profileImage ?? null,
    activeServiceId: user.profile?.activeServiceId ?? null,
    platformAccountId: user.profile?.platformAccountId ?? null,
    oneXbetId: user.profile?.oneXbetId ?? null,
    mtnNumber: user.profile?.mtnNumber ?? null,
    moovNumber: user.profile?.moovNumber ?? null,
    celtiisNumber: user.profile?.celtiisNumber ?? null,
    orangeNumber: user.profile?.orangeNumber ?? null,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
};

// UPDATE PROFILE

export const updateProfile = async (
  userId: string,
  data: UpdateProfileDtoType,
) => {
  const user = await ProfileRepository.findProfileByUserId(userId);

  if (!user) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  const { first_name, last_name, phone, ...profileData } = data;

  if (first_name || last_name || phone) {
    await ProfileRepository.updateUserInfo(userId, {
      ...(first_name && { first_name }),
      ...(last_name && { last_name }),
      ...(phone && { phone }),
    });
  }

  const hasProfileData = Object.keys(profileData).length > 0;
  if (hasProfileData) {
    await ProfileRepository.updateProfileInfo(userId, profileData);
  }

  return getProfile(userId);
};

// UPDATE PASSWORD

export const updatePassword = async (
  userId: string,
  data: UpdatePasswordDtoType,
) => {
  const user = await ProfileRepository.findProfileByUserId(userId);

  if (!user) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  const isMatch = await bcrypt.compare(data.oldPassword, user.password_hash);

  if (!isMatch) {
    throw new BadRequestException("Ancien mot de passe incorrect.");
  }

  const password_hash = await bcrypt.hash(data.newPassword, 10);

  await ProfileRepository.updateUserPassword(userId, password_hash);
};

// GENERATE REFERRAL CODE

export const generateReferralCode = async (userId: string) => {
  const user = await ProfileRepository.findUserReferralCode(userId);

  if (!user) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  if (user.referralCode) {
    throw new BadRequestException(
      "Vous avez déjà un code de parrainage. Il ne peut être généré qu'une seule fois.",
    );
  }

  const referralCode = await generateUniquePublicId("REF");

  await ProfileRepository.saveReferralCode(userId, referralCode);

  return { referralCode };
};

// GET MY REFERRALS

export const getMyReferrals = async (
  userId: string,
): Promise<ReferralSummary> => {
  const user = await ProfileRepository.findProfileByUserId(userId);

  if (!user) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  const referrals = await ProfileRepository.findReferralsByUserId(userId);

  const validated = referrals.filter((r) => r.status === "VALIDATED");
  const pending = referrals.filter((r) => r.status === "PENDING");

  return {
    totalReferrals: referrals.length,
    validatedReferrals: validated.length,
    pendingReferrals: pending.length,
    pointsBalance: user.pointsBalance,
    referrals: referrals.map((r) => ({
      id: r.id,
      referredName: `${r.referred.first_name} ${r.referred.last_name}`.trim(),
      status: r.status,
      createdAt: r.createdAt,
      validatedAt: r.validatedAt,
    })),
  };
};
