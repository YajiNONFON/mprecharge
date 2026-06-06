import { z } from "zod";

export const UpdateProfileDto = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "Le prénom doit comporter au moins 2 caractères" })
      .max(50, { message: "Le prénom doit comporter au maximum 50 caractères" })
      .optional(),
    last_name: z
      .string()
      .min(2, { message: "Le nom doit comporter au moins 2 caractères" })
      .max(50, { message: "Le nom doit comporter au maximum 50 caractères" })
      .optional(),
    phone: z
      .string()
      .min(8, {
        message: "Le numéro de téléphone doit comporter au moins 8 chiffres",
      })
      .max(20, {
        message: "Le numéro de téléphone doit comporter au maximum 20 chiffres",
      })
      .optional(),
    oneXbetId: z.string().optional(),
    platformAccountId: z.string().optional(),
    mtnNumber: z.string().optional(),
    moovNumber: z.string().optional(),
    celtiisNumber: z.string().optional(),
    orangeNumber: z.string().optional(),
    activeServiceId: z.string().uuid().optional(),
  })
  .strict();

export const UpdatePasswordDto = z
  .object({
    oldPassword: z
      .string()
      .min(1, { message: "L'ancien mot de passe est obligatoire" }),
    newPassword: z
      .string()
      .min(8, {
        message: "Le mot de passe doit comporter au moins 8 caractères",
      })
      .max(64, {
        message: "Le mot de passe doit comporter au maximum 64 caractères",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "La confirmation est obligatoire" }),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export type UpdateProfileDtoType = z.infer<typeof UpdateProfileDto>;
export type UpdatePasswordDtoType = z.infer<typeof UpdatePasswordDto>;
