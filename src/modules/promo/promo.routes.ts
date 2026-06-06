import { Router } from "express";
import * as PromoController from "./promo.controller";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  authenticateUser,
  supAdminOnly,
} from "../../shared/middlewares/auth.middleware";
import { upload } from "../../shared/middlewares/upload.middleware";
import { CreatePromoDto, UpdatePromoDto } from "./promo.dto";

export const promoRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Promos
 *   description: Promotional banners management
 */

/**
 * @swagger
 * /promos:
 *   get:
 *     summary: Get all promos (public)
 *     tags: [Promos]
 *     security: []
 *     responses:
 *       200:
 *         description: Promos retrieved successfully
 */
promoRouter.get("/", PromoController.getPromos);

/**
 * @swagger
 * /promos:
 *   post:
 *     summary: Create a new promo (super admin only)
 *     tags: [Promos]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *                 example: Promotion de Noël
 *     responses:
 *       201:
 *         description: Promo created successfully
 *       400:
 *         description: No image uploaded
 */
promoRouter.post(
  "/",
  authenticateUser,
  supAdminOnly,
  upload.single("image"),
  validate(CreatePromoDto),
  PromoController.createPromo,
);

/**
 * @swagger
 * /promos/{id}:
 *   patch:
 *     summary: Update a promo (super admin only)
 *     tags: [Promos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Promo updated successfully
 *       404:
 *         description: Promo not found
 */
promoRouter.patch(
  "/:id",
  authenticateUser,
  supAdminOnly,
  upload.single("image"),
  validate(UpdatePromoDto),
  PromoController.updatePromo,
);

/**
 * @swagger
 * /promos/{id}:
 *   delete:
 *     summary: Delete a promo (super admin only)
 *     tags: [Promos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Promo deleted successfully
 *       404:
 *         description: Promo not found
 */
promoRouter.delete(
  "/:id",
  authenticateUser,
  supAdminOnly,
  PromoController.deletePromo,
);
