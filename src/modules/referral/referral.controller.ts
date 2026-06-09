import { Request, Response, NextFunction } from "express";
import {
  getMyReferralStats,
  getAllReferrals,
  createPayout,
  getConversionRateService,
  updateConversionRateService,
} from "./referral.service";
import * as ReferralService from "./referral.service";
import type {
  CreatePayoutDtoType,
  UpdateConversionRateDtoType,
} from "./referral.dto";

export const getMyReferralStatsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const stats = await getMyReferralStats(userId, page, limit);
    stats.referralCode = (req.user as any).referralCode ?? null;
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const getAllReferralsController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) ?? undefined;
    const status = (req.query.status as string) ?? undefined;

    const stats = await getAllReferrals({ page, limit, search, status });
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

export const createPayoutController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const adminId = req.user!.userId;
    const body = req.body as CreatePayoutDtoType;
    const result = await createPayout(body, adminId);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getConversionRateController = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = await getConversionRateService();
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const updateConversionRateController = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const body = req.body as UpdateConversionRateDtoType;
    const data = await updateConversionRateService(body);
    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getReferrerDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const referrerId = req.params.referrerId as string;
    const details = await ReferralService.getReferrerDetails(referrerId);
    return res.status(200).json(details);
  } catch (error) {
    next(error);
  }
};
