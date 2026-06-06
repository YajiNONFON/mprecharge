import { Request, Response, NextFunction } from "express";
import * as ProfileService from "./profile.service";
import type {
  UpdateProfileDtoType,
  UpdatePasswordDtoType,
} from "./profile.dto";

// GET PROFILE

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const profile = await ProfileService.getProfile(userId);
    return res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
};

// UPDATE PROFILE

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as UpdateProfileDtoType;
    const profile = await ProfileService.updateProfile(userId, body);
    return res.status(200).json({
      message: "Profil mis à jour avec succès.",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// UPDATE PASSWORD

export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as UpdatePasswordDtoType;
    await ProfileService.updatePassword(userId, body);
    return res.status(200).json({
      message: "Mot de passe mis à jour avec succès.",
    });
  } catch (error) {
    next(error);
  }
};

// GENERATE REFERRAL CODE

export const generateReferralCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const result = await ProfileService.generateReferralCode(userId);
    return res.status(201).json({
      message: "Code de parrainage généré avec succès.",
      referralCode: result.referralCode,
    });
  } catch (error) {
    next(error);
  }
};

// GET MY REFERRALS

export const getMyReferrals = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user!.userId;
    const summary = await ProfileService.getMyReferrals(userId);
    return res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};
