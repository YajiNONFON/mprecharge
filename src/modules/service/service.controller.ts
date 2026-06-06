import { Request, Response, NextFunction } from "express";
import * as ServiceService from "./service.service";
import type { CreateServiceDtoType, UpdateServiceDtoType } from "./service.dto";

export const getServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const services = await ServiceService.getServices();
    return res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const services = await ServiceService.getAllServices();
    return res.status(200).json(services);
  } catch (error) {
    next(error);
  }
};

export const createService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as CreateServiceDtoType;
    const service = await ServiceService.createService(body);
    return res.status(201).json(service);
  } catch (error) {
    next(error);
  }
};

export const updateService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    const body = req.body as UpdateServiceDtoType;
    const service = await ServiceService.updateService(id, body);
    return res.status(200).json(service);
  } catch (error) {
    next(error);
  }
};

export const deleteService = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = req.params.id as string;
    await ServiceService.deleteService(id);
    return res.status(200).json({ message: "Service supprimé avec succès." });
  } catch (error) {
    next(error);
  }
};
