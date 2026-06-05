import type { Request, Response, NextFunction } from "express";
import { sanitizeInput } from "../utils/sanitizer";

export function sanitizeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body);
  }

  // req.query est read-only — on nettoie les valeurs sans réassigner
  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      const value = req.query[key];
      if (typeof value === "string") {
        (req.query as Record<string, any>)[key] = sanitizeInput(value);
      }
    });
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeInput(req.params);
  }

  next();
}

export function sanitizeBody(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeInput(req.body);
  }
  next();
}
