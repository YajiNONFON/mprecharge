import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/app-error";

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  console.error(`[ERROR] ${req.method} ${req.path}`, {
    message: error.message,
    stack: error.stack,
    body: req.body,
  });
  // Erreur métier connue
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  // Erreur inconnue — ne pas exposer les détails en production
  console.error(error);

  res.status(500).json({
    message:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : error.message,
  });
};
