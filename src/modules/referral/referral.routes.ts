import { Router } from "express";
import { CreatePayoutDto, UpdateConversionRateDto } from "./referral.dto";
import {
  getMyReferralStatsController,
  getAllReferralsController,
  createPayoutController,
  getConversionRateController,
  updateConversionRateController,
} from "./referral.controller";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  authenticateUser,
  protectedRoute,
  supAdminOnly,
} from "../../shared/middlewares/auth.middleware";

export const referralRouter = Router();

referralRouter.use(authenticateUser, protectedRoute);

// ─── USER ────────────────────────────────

/**
 * @swagger
 * /referrals/me:
 *   get:
 *     summary: Stats de parrainage du user connecté
 *     tags: [Referrals]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Stats complètes (filleuls, points, historique)
 *       401:
 *         description: Non authentifié
 */
referralRouter.get("/me", getMyReferralStatsController);

// ─── ADMIN ───────────────────────────────

/**
 * @swagger
 * /referrals/admin/all:
 *   get:
 *     summary: Liste tous les parrainages (admin)
 *     tags: [Referrals]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Stats globales de parrainage
 *       403:
 *         description: Accès refusé
 */
referralRouter.get("/admin/all", supAdminOnly, getAllReferralsController);

/**
 * @swagger
 * /referrals/admin/payout:
 *   post:
 *     summary: Créer un payout pour un parrain (admin)
 *     tags: [Referrals]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, pointsToConvert]
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               pointsToConvert:
 *                 type: number
 *                 minimum: 500
 *     responses:
 *       201:
 *         description: Payout créé
 *       400:
 *         description: Données invalides
 */
referralRouter.post(
  "/admin/payout",
  supAdminOnly,
  validate(CreatePayoutDto),
  createPayoutController,
);

/**
 * @swagger
 * /referrals/admin/conversion-rate:
 *   get:
 *     summary: Taux de conversion actuel (admin)
 *     tags: [Referrals]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Taux actuel
 */
referralRouter.get(
  "/admin/conversion-rate",
  supAdminOnly,
  getConversionRateController,
);

/**
 * @swagger
 * /referrals/admin/conversion-rate:
 *   patch:
 *     summary: Modifier le taux de conversion (admin)
 *     tags: [Referrals]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rate]
 *             properties:
 *               rate:
 *                 type: number
 *                 minimum: 0.01
 *     responses:
 *       200:
 *         description: Taux mis à jour
 */
referralRouter.patch(
  "/admin/conversion-rate",
  supAdminOnly,
  validate(UpdateConversionRateDto),
  updateConversionRateController,
);
