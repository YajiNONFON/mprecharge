import * as PromoRepository from "./promo.repository";
import { storageService } from "../../infrastructure/storage/storage.service";
import type { CreatePromoDtoType, UpdatePromoDtoType } from "./promo.dto";
import {
  BadRequestException,
  NotFoundException,
} from "../../shared/errors/http-errors";

export const getPromos = async () => {
  return PromoRepository.findAllPromos();
};

export const createPromo = async (
  file: Express.Multer.File | undefined,
  data: CreatePromoDtoType,
) => {
  if (!file) {
    throw new BadRequestException("Aucune image téléchargée.");
  }

  const imageUrl = await storageService.upload(file.path, "mpay_promos");

  return PromoRepository.createPromo({
    imageUrl,
    description: data.description ?? null,
  });
};

export const updatePromo = async (
  id: number,
  file: Express.Multer.File | undefined,
  data: UpdatePromoDtoType,
) => {
  const promo = await PromoRepository.findPromoById(id);

  if (!promo) {
    throw new NotFoundException("Promotion introuvable.");
  }

  const updateData: { imageUrl?: string; description?: string | null } = {};

  if (file) {
    updateData.imageUrl = await storageService.upload(file.path, "mpay_promos");
  }

  if (data.description !== undefined) {
    updateData.description = data.description ?? null;
  }

  if (Object.keys(updateData).length === 0) {
    throw new BadRequestException("Aucune donnée à mettre à jour.");
  }

  return PromoRepository.updatePromo(id, updateData);
};

export const deletePromo = async (id: number) => {
  const promo = await PromoRepository.findPromoById(id);

  if (!promo) {
    throw new NotFoundException("Promotion introuvable.");
  }

  return PromoRepository.deletePromo(id);
};
