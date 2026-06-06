import { prisma } from "../../infrastructure/database/prisma";

export const findAllPromos = async () => {
  return prisma.promo.findMany({
    orderBy: { createdAt: "desc" },
  });
};

export const findPromoById = async (id: number) => {
  return prisma.promo.findUnique({ where: { id } });
};

export const createPromo = async (data: {
  imageUrl: string;
  description?: string | null;
}) => {
  return prisma.promo.create({ data });
};

export const updatePromo = async (
  id: number,
  data: { imageUrl?: string; description?: string | null },
) => {
  return prisma.promo.update({ where: { id }, data });
};

export const deletePromo = async (id: number) => {
  return prisma.promo.delete({ where: { id } });
};
