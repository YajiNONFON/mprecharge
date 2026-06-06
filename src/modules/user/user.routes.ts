import { Router } from "express";
import * as UserController from "./user.controller";
import {
  authenticateUser,
  adminOnly,
  supAdminOnly,
} from "../../shared/middlewares/auth.middleware";

export const userRouter = Router();

userRouter.use(authenticateUser);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management (admin only)
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users with pagination, search and filters
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           example: Yaji
 *         description: Search by name, email, phone or publicId
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CLIENT, ADMIN]
 *           example: CLIENT
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *           example: active
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *       403:
 *         description: Forbidden
 */
userRouter.get("/", adminOnly, UserController.getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 *       403:
 *         description: Forbidden
 */
userRouter.get("/:id", adminOnly, UserController.getUserById);

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Toggle user active status
 *     tags: [Users]
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
 *             required:
 *               - is_active
 *             properties:
 *               is_active:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Invalid data
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.patch("/:id/status", adminOnly, UserController.toggleUserStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Soft delete a user (super admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
userRouter.delete("/:id", supAdminOnly, UserController.deleteUser);
