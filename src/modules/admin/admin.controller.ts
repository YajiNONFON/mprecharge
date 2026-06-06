import { Request, Response, NextFunction } from "express";
import * as AdminService from "./admin.service";

export const getAdminStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const period =
      (req.query.period as "day" | "week" | "month" | "year") ?? "day";

    const validPeriods = ["day", "week", "month", "year"];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({
        message:
          "Période invalide. Valeurs acceptées : day, week, month, year.",
      });
    }

    const stats = await AdminService.getAdminStats(period);
    return res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
};
