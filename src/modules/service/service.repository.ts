import { Gateway } from "../../../generated/prisma/enums";
import { prisma } from "../../infrastructure/database/prisma";

export const findAllServices = async () => {
  return prisma.service.findMany({
    orderBy: { created_at: "desc" },
  });
};

export const findActiveServices = async () => {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { created_at: "desc" },
  });
};

export const findServiceById = async (id: string) => {
  return prisma.service.findUnique({ where: { id } });
};

export const findServiceByName = async (name: string) => {
  return prisma.service.findFirst({ where: { name } });
};

export const createService = async (data: {
  name: string;
  displayName: string;
  description?: string;
  apiBaseUrl?: string;
}) => {
  return prisma.service.create({ data });
};

export const updateService = async (
  id: string,
  data: {
    displayName?: string;
    description?: string;
    apiBaseUrl?: string;
    isActive?: boolean;
    activeGateway?: Gateway;
  },
) => {
  return prisma.service.update({ where: { id }, data });
};

export const deleteService = async (id: string) => {
  return prisma.service.delete({ where: { id } });
};
