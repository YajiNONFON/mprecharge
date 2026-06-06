import * as ServiceRepository from "./service.repository";
import type { CreateServiceDtoType, UpdateServiceDtoType } from "./service.dto";
import {
  ConflictException,
  NotFoundException,
} from "../../shared/errors/http-errors";

export const getServices = async () => {
  return ServiceRepository.findActiveServices();
};

export const getAllServices = async () => {
  return ServiceRepository.findAllServices();
};

export const createService = async (data: CreateServiceDtoType) => {
  const existing = await ServiceRepository.findServiceByName(data.name);
  if (existing) {
    throw new ConflictException("Un service avec ce nom existe déjà.");
  }
  return ServiceRepository.createService(data);
};

export const updateService = async (id: string, data: UpdateServiceDtoType) => {
  const service = await ServiceRepository.findServiceById(id);
  if (!service) {
    throw new NotFoundException("Service introuvable.");
  }
  return ServiceRepository.updateService(id, data);
};

export const deleteService = async (id: string) => {
  const service = await ServiceRepository.findServiceById(id);
  if (!service) {
    throw new NotFoundException("Service introuvable.");
  }
  return ServiceRepository.deleteService(id);
};
