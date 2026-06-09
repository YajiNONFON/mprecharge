import { Request, Response, NextFunction } from "express";
import * as UserService from "./user.service";

// GET ALL USERS

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const role = req.query.role as string | undefined;
    const status = req.query.status as string | undefined;
    const filter = req.query.filter as
      | "best"
      | "at_risk"
      | "blocked"
      | undefined;

    if (filter && !["best", "at_risk", "blocked"].includes(filter)) {
      return res.status(400).json({
        message: "Filtre invalide. Valeurs acceptées : best, at_risk, blocked.",
      });
    }

    const result = await UserService.getAllUsers({
      page,
      limit,
      search,
      role,
      status,
      filter,
    });

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET USER BY ID

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const user = await UserService.getUserById(id);
    return res.status(200).json(user);
  } catch (error) {
    next(error);
  }
};

// DELETE USER

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const adminRole = req.user!.role;
    await UserService.deleteUser(adminRole, id);
    return res
      .status(200)
      .json({ message: "Utilisateur désactivé avec succès." });
  } catch (error) {
    next(error);
  }
};

// TOGGLE USER STATUS

export const toggleUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const { is_active } = req.body;
    const adminRole = req.user!.role;

    if (typeof is_active !== "boolean") {
      return res.status(400).json({
        message: "Le champ is_active doit être un booléen.",
      });
    }

    await UserService.toggleUserStatus(adminRole, id, is_active);

    return res.status(200).json({
      message: `Utilisateur ${is_active ? "activé" : "désactivé"} avec succès.`,
    });
  } catch (error) {
    next(error);
  }
};
