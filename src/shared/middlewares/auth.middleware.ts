import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../../modules/auth/auth.types";

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401).json({ message: "Jeton d'authentification manquant." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Jeton invalide ou expiré." });
    return;
  }
};

export const protectedRoute = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) {
    res.status(401).json({
      message: "Accès non autorisé : veuillez vous connecter d'abord.",
    });
    return;
  }
  next();
};

export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (!role || !["ADMIN", "SUPER_ADMIN", "ADMIN_DEV"].includes(role)) {
    res.status(403).json({
      message: "Accès interdit : réservé aux administrateurs.",
    });
    return;
  }
  next();
};

export const supAdminOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.user?.role;
  if (!role || !["SUPER_ADMIN", "ADMIN_DEV"].includes(role)) {
    res.status(403).json({
      message: "Accès interdit : réservé aux super administrateurs.",
    });
    return;
  }
  next();
};
