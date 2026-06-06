import { z } from "zod";

const networkTypes = [
  "mtn",
  "moov",
  "celtiis_bj",
  "moov_tg",
  "moov_bf",
  "orange_bf",
  "orange_sn",
  "mtn_ci",
  "moov_ci",
  "orange_ci",
] as const;

export const DepositDto = z
  .object({
    serviceId: z
      .string()
      .min(1, { message: "L'identifiant du service est requis" })
      .max(100, { message: "L'identifiant du service est trop long" }),
    amount: z.coerce
      .number({ message: "Le montant doit être un nombre" })
      .positive({ message: "Le montant doit être positif" })
      .min(200, { message: "Le minimum est de 200 XOF" })
      .max(100000, { message: "Le dépôt maximum est de 100 000 XOF" }),
    networkType: z.enum(networkTypes, {
      message: "Type de réseau invalide",
    }),
    paymentNumber: z
      .string()
      .min(6, {
        message: "Le numéro de téléphone doit comporter au moins 6 chiffres",
      })
      .max(15, {
        message: "Le numéro de téléphone doit comporter au maximum 15 chiffres",
      }),
    accountId: z
      .string()
      .min(3, { message: "L'identifiant du compte ne peut pas être vide" })
      .max(13, { message: "L'identifiant du compte est trop long" })
      .regex(/^\d+$/, {
        message: "L'identifiant 1xBet ne doit contenir que des chiffres",
      }),
  })
  .strict();

export const WithdrawalDto = z
  .object({
    serviceId: z
      .string()
      .min(1, { message: "L'identifiant du service est requis" })
      .max(100, { message: "L'identifiant du service est trop long" }),
    amount: z.coerce
      .number({ message: "Le montant doit être un nombre" })
      .positive({ message: "Le montant doit être positif" })
      .min(200, { message: "Le minimum est de 200 XOF" })
      .max(100000, { message: "Le retrait maximum est de 100 000 XOF" }),
    networkType: z.enum(networkTypes, {
      message: "Type de réseau invalide",
    }),
    receiverNumber: z
      .string()
      .min(6, {
        message: "Le numéro de téléphone doit comporter au moins 6 chiffres",
      })
      .max(15, {
        message: "Le numéro de téléphone doit comporter au maximum 15 chiffres",
      }),
    receiverFullName: z
      .string()
      .min(3, {
        message: "Le nom complet doit comporter au moins 3 caractères",
      })
      .max(100, { message: "Le nom complet est trop long" })
      .regex(/^[\p{L}\s'-]+$/u, {
        message:
          "Le nom complet ne peut contenir que des lettres, espaces, tirets et apostrophes",
      }),
    withdrawalCode: z
      .string()
      .min(4, {
        message: "Le code de retrait doit comporter au moins 4 caractères",
      })
      .max(6, { message: "Le code de retrait est trop long" })
      .optional(),
    accountId: z
      .string()
      .min(3, { message: "L'identifiant du compte ne peut pas être vide" })
      .max(13, { message: "L'identifiant du compte est trop long" })
      .regex(/^\d+$/, {
        message: "L'identifiant 1xBet ne doit contenir que des chiffres",
      }),
  })
  .strict();

export type NetworkType = (typeof networkTypes)[number];
export type DepositDtoType = z.infer<typeof DepositDto>;
export type WithdrawalDtoType = z.infer<typeof WithdrawalDto>;
