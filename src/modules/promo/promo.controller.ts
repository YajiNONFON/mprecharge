import { Request, Response, NextFunction } from "express";
import * as PromoService from "./promo.service";
import type { CreatePromoDtoType, UpdatePromoDtoType } from "./promo.dto";

export const getPromos = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const promos = await PromoService.getPromos();
    return res.status(200).json(promos);
  } catch (error) {
    next(error);
  }
};

export const createPromo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const file = req.file;
    const body = req.body as CreatePromoDtoType;
    const promo = await PromoService.createPromo(file, body);
    return res.status(201).json(promo);
  } catch (error) {
    next(error);
  }
};

export const updatePromo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ message: "Identifiant de promotion invalide." });
    }

    const file = req.file;
    const body = req.body as UpdatePromoDtoType;
    const promo = await PromoService.updatePromo(id, file, body);
    return res.status(200).json(promo);
  } catch (error) {
    next(error);
  }
};

export const deletePromo = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res
        .status(400)
        .json({ message: "Identifiant de promotion invalide." });
    }

    await PromoService.deletePromo(id);
    return res
      .status(200)
      .json({ message: "Promotion supprimée avec succès." });
  } catch (error) {
    next(error);
  }
};
