import { z } from "zod";

export const SignUpDto = z
  .object({
    first_name: z
      .string()
      .min(2, { message: "Le prénom doit comporter au moins 2 caractères" })
      .max(50, {
        message: "Le prénom doit comporter au maximum 50 caractères",
      }),
    last_name: z
      .string()
      .min(2, { message: "Le nom doit comporter au moins 2 caractères" })
      .max(50, { message: "Le nom doit comporter au maximum 50 caractères" }),
    email: z
      .string()
      .min(1, { message: "L'adresse e-mail est obligatoire" })
      .email({ message: "Format d'e-mail invalide" }),
    phone: z
      .string()
      .min(8, {
        message: "Le numéro de téléphone doit comporter au moins 8 chiffres",
      })
      .max(20, {
        message: "Le numéro de téléphone doit comporter au maximum 20 chiffres",
      }),
    password: z
      .string()
      .min(8, {
        message: "Le mot de passe doit comporter au moins 8 caractères",
      })
      .max(64, {
        message: "Le mot de passe doit comporter au maximum 64 caractères",
      }),
    confirmPassword: z
      .string()
      .min(1, { message: "La confirmation du mot de passe est obligatoire" }),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "Vous devez accepter les conditions générales",
    }),
    referralCode: z.string().optional(),
    deviceName: z.string().optional(),
  })
  .strict()
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const SignInDto = z
  .object({
    email: z
      .string()
      .min(1, { message: "L'adresse e-mail est obligatoire" })
      .email({ message: "Format d'e-mail invalide" }),
    password: z.string().min(1, { message: "Le mot de passe est obligatoire" }),
    rememberMe: z.boolean().optional().default(false),
    deviceName: z.string().optional(),
  })
  .strict();

export const ForgotPasswordDto = z
  .object({
    email: z
      .string()
      .min(1, { message: "L'adresse e-mail est obligatoire" })
      .email({ message: "Format d'e-mail invalide" }),
  })
  .strict();

export const VerifyResetCodeDto = z
  .object({
    email: z
      .string()
      .min(1, { message: "L'adresse e-mail est obligatoire" })
      .email({ message: "Format d'e-mail invalide" }),
    code: z
      .string()
      .length(6, { message: "Le code doit comporter exactement 6 caractères" }),
  })
  .strict();

export const ResetPasswordDto = z
  .object({
    email: z
      .string()
      .min(1, { message: "L'adresse e-mail est obligatoire" })
      .email({ message: "Format d'e-mail invalide" }),
    code: z
      .string()
      .length(6, { message: "Le code doit comporter exactement 6 caractères" }),
    newPassword: z
      .string()
      .min(8, {
        message: "Le mot de passe doit comporter au moins 8 caractères",
      })
      .max(64, {
        message: "Le mot de passe doit comporter au maximum 64 caractères",
      }),
  })
  .strict();

export const RefreshTokenDto = z
  .object({
    refreshToken: z
      .string()
      .min(1, { message: "Le refresh token est obligatoire" }),
  })
  .strict();

export type SignUpDtoType = z.infer<typeof SignUpDto>;
export type SignInDtoType = z.infer<typeof SignInDto>;
export type ForgotPasswordDtoType = z.infer<typeof ForgotPasswordDto>;
export type VerifyResetCodeDtoType = z.infer<typeof VerifyResetCodeDto>;
export type ResetPasswordDtoType = z.infer<typeof ResetPasswordDto>;
export type RefreshTokenDtoType = z.infer<typeof RefreshTokenDto>;
