import { Role } from "../../../generated/prisma/enums";
import {
  ForbiddenException,
  NotFoundException,
} from "../../shared/errors/http-errors";
import * as UserRepository from "./user.repository";
import type { GetAllUsersParams } from "./user.repository";

// GET ALL USERS

export const getAllUsers = async (params: GetAllUsersParams) => {
  const { users, total, totalPages, currentPage } =
    await UserRepository.findAllUsers(params);

  const formatted = users.map((u) => ({
    id: u.id,
    name: `${u.first_name} ${u.last_name}`.trim(),
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: u.is_active ? "active" : "inactive",
    publicId: u.public_id,
    referralCode: u.referral_code,
    pointsBalance: u.points_balance,
    joinedAt: u.created_at,
    stats: {
      success: u.success_count,
      failed: u.failed_count,
      pending: u.pending_count,
    },
  }));

  return { users: formatted, total, totalPages, currentPage };
};

// GET USER BY ID

export const getUserById = async (id: string) => {
  const user = await UserRepository.findUserById(id);
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
    isActive: user.is_active,
    referralCode: user.referralCode,
    pointsBalance: user.pointsBalance,
    publicId: user.profile?.publicId ?? null,
    oneXbetId: user.profile?.oneXbetId ?? null,
    joinedAt: user.created_at,
  };
};

// SOFT DELETE

export const deleteUser = async (adminRole: string, targetId: string) => {
  if (adminRole !== Role.SUPER_ADMIN && adminRole !== Role.ADMIN_DEV) {
    throw new ForbiddenException(
      "Accès refusé : réservé aux super administrateurs.",
    );
  }

  const target = await UserRepository.findUserById(targetId);
  if (!target) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  if (target.role === Role.SUPER_ADMIN || target.role === Role.ADMIN_DEV) {
    throw new ForbiddenException(
      "Impossible de supprimer un compte administrateur.",
    );
  }

  await UserRepository.softDeleteUser(targetId);
};

// TOGGLE STATUS

export const toggleUserStatus = async (
  adminRole: string,
  targetId: string,
  is_active: boolean,
) => {
  if (
    adminRole !== Role.ADMIN &&
    adminRole !== Role.SUPER_ADMIN &&
    adminRole !== Role.ADMIN_DEV
  ) {
    throw new ForbiddenException("Accès refusé : réservé aux administrateurs.");
  }

  const target = await UserRepository.findUserById(targetId);
  if (!target) {
    throw new NotFoundException("Utilisateur non trouvé.");
  }

  if (target.role === Role.SUPER_ADMIN || target.role === Role.ADMIN_DEV) {
    throw new ForbiddenException(
      "Impossible de modifier le statut d'un compte administrateur.",
    );
  }

  await UserRepository.toggleUserStatus(targetId, is_active);
};
