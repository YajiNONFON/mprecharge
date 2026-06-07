import { z } from "zod";

// VALIDATE REFERRAL (admin)

export const ValidateReferralDto = z
  .object({
    referralId: z.string().uuid({ message: "ID de parrainage invalide" }),
  })
  .strict();

// CREATE PAYOUT (admin)

export const CreatePayoutDto = z
  .object({
    userId: z.string().uuid({ message: "ID utilisateur invalide" }),
    pointsToConvert: z
      .number({ message: "Le nombre de points doit être un nombre" })
      .min(500, { message: "Le minimum pour un payout est de 500 points" }),
  })
  .strict();

// UPDATE CONVERSION RATE (admin)

export const UpdateConversionRateDto = z
  .object({
    rate: z
      .number({ message: "Le taux doit être un nombre" })
      .positive({ message: "Le taux doit être positif" })
      .min(0.01, { message: "Le taux minimum est de 0.01" }),
  })
  .strict();

export type ValidateReferralDtoType = z.infer<typeof ValidateReferralDto>;
export type CreatePayoutDtoType = z.infer<typeof CreatePayoutDto>;
export type UpdateConversionRateDtoType = z.infer<
  typeof UpdateConversionRateDto
>;
