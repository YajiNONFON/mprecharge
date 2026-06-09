import { Router } from "express";
import * as ServiceController from "./service.controller";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  authenticateUser,
  adminOnly,
  supAdminOnly,
} from "../../shared/middlewares/auth.middleware";
import { CreateServiceDto, UpdateServiceDto } from "./service.dto";

export const serviceRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Services
 *   description: Recharge services management
 */

/**
 * @swagger
 * /services:
 *   get:
 *     summary: Get all active services (public)
 *     tags: [Services]
 *     security: []
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 */
serviceRouter.get("/", authenticateUser, ServiceController.getServices);

/**
 * @swagger
 * /services/admin/all:
 *   get:
 *     summary: Get all services including inactive (admin only)
 *     tags: [Services]
 *     responses:
 *       200:
 *         description: Services retrieved successfully
 *       403:
 *         description: Forbidden
 */
serviceRouter.get(
  "/admin/all",
  authenticateUser,
  adminOnly,
  ServiceController.getAllServices,
);

/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service (super admin only)
 *     tags: [Services]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - displayName
 *             properties:
 *               name:
 *                 type: string
 *                 example: 1xBet
 *               displayName:
 *                 type: string
 *                 example: 1xBet Bénin
 *               description:
 *                 type: string
 *                 example: Recharge de compte 1xBet
 *               apiBaseUrl:
 *                 type: string
 *                 example: https://api.1xbet.com
 *     responses:
 *       201:
 *         description: Service created successfully
 *       409:
 *         description: Service already exists
 */
serviceRouter.post(
  "/",
  authenticateUser,
  supAdminOnly,
  validate(CreateServiceDto),
  ServiceController.createService,
);

/**
 * @swagger
 * /services/{id}:
 *   patch:
 *     summary: Update a service (super admin only)
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               description:
 *                 type: string
 *               apiBaseUrl:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *               activeGateway:
 *                 type: string
 *                 enum: [FEEXPAY, FEDAPAY]
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       404:
 *         description: Service not found
 */
serviceRouter.patch(
  "/:id",
  authenticateUser,
  supAdminOnly,
  validate(UpdateServiceDto),
  ServiceController.updateService,
);

/**
 * @swagger
 * /services/{id}:
 *   delete:
 *     summary: Delete a service (super admin only)
 *     tags: [Services]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 */
serviceRouter.delete(
  "/:id",
  authenticateUser,
  supAdminOnly,
  ServiceController.deleteService,
);
