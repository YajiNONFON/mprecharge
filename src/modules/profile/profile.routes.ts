import { Router } from "express";
import * as ProfileController from "./profile.controller";
import { validate } from "../../shared/middlewares/validate.middleware";
import {
  authenticateUser,
  protectedRoute,
} from "../../shared/middlewares/auth.middleware";
import { UpdateProfileDto, UpdatePasswordDto } from "./profile.dto";

export const profileRouter = Router();

profileRouter.use(authenticateUser, protectedRoute);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
profileRouter.get("/", ProfileController.getProfile);

/**
 * @swagger
 * /profile:
 *   patch:
 *     summary: Update current user profile
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Yaji
 *               last_name:
 *                 type: string
 *                 example: NONFON
 *               phone:
 *                 type: string
 *                 example: "22997000000"
 *               oneXbetId:
 *                 type: string
 *                 example: "12345678"
 *               platformAccountId:
 *                 type: string
 *                 example: "ACC-123"
 *               mtnNumber:
 *                 type: string
 *                 example: "22997000000"
 *               moovNumber:
 *                 type: string
 *                 example: "22994000000"
 *               celtiisNumber:
 *                 type: string
 *                 example: "22901000000"
 *               orangeNumber:
 *                 type: string
 *                 example: "22960000000"
 *               activeServiceId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid data
 *       404:
 *         description: User not found
 */
profileRouter.patch(
  "/",
  validate(UpdateProfileDto),
  ProfileController.updateProfile,
);

/**
 * @swagger
 * /profile/password:
 *   patch:
 *     summary: Update current user password
 *     tags: [Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: oldpassword123
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid data or wrong old password
 *       404:
 *         description: User not found
 */
profileRouter.patch(
  "/password",
  validate(UpdatePasswordDto),
  ProfileController.updatePassword,
);

/**
 * @swagger
 * /profile/referral-code:
 *   post:
 *     summary: Generate referral code (one time only)
 *     tags: [Profile]
 *     responses:
 *       201:
 *         description: Referral code generated successfully
 *       400:
 *         description: Referral code already exists
 *       404:
 *         description: User not found
 */
profileRouter.post("/referral-code", ProfileController.generateReferralCode);

/**
 * @swagger
 * /profile/referrals:
 *   get:
 *     summary: Get current user referrals and points summary
 *     tags: [Profile]
 *     responses:
 *       200:
 *         description: Referrals retrieved successfully
 *       404:
 *         description: User not found
 */
profileRouter.get("/referrals", ProfileController.getMyReferrals);
