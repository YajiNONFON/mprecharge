import { Request, Response, NextFunction } from "express";
import { getHealthReport } from "./health.service";

// GET /admin/health
export const getHealth = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const report = await getHealthReport();
    const httpStatus = report.status === "OK" ? 200 : 503;
    return res.status(httpStatus).json(report);
  } catch (error) {
    next(error);
  }
};
