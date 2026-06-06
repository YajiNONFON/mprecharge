import { z } from "zod";

export const CreateServiceDto = z
  .object({
    name: z.string().min(1, { message: "Le nom est obligatoire" }).max(50),
    displayName: z
      .string()
      .min(1, { message: "Le nom d'affichage est obligatoire" })
      .max(50),
    description: z.string().optional(),
    apiBaseUrl: z.string().url({ message: "URL invalide" }).optional(),
  })
  .strict();

export const UpdateServiceDto = z
  .object({
    displayName: z.string().min(1).max(50).optional(),
    description: z.string().optional(),
    apiBaseUrl: z.string().url({ message: "URL invalide" }).optional(),
    isActive: z.boolean().optional(),
    activeGateway: z.enum(["FEEXPAY", "FEDAPAY"]).optional(),
  })
  .strict();

export type CreateServiceDtoType = z.infer<typeof CreateServiceDto>;
export type UpdateServiceDtoType = z.infer<typeof UpdateServiceDto>;
