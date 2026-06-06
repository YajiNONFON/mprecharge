import { z } from "zod";

export const CreatePromoDto = z
  .object({
    description: z.string().max(255).optional(),
  })
  .strict();

export const UpdatePromoDto = z
  .object({
    description: z.string().max(255).optional(),
  })
  .strict();

export type CreatePromoDtoType = z.infer<typeof CreatePromoDto>;
export type UpdatePromoDtoType = z.infer<typeof UpdatePromoDto>;
