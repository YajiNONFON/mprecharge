import { Router } from "express";
import * as AuthController from "./auth.controller";
import {
  SignUpDto,
  SignInDto,
  ForgotPasswordDto,
  VerifyResetCodeDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from "./auth.dto";
import {
  authenticateUser,
  protectedRoute,
} from "../../shared/middlewares/auth.middleware";
import { validate } from "../../shared/middlewares/validate.middleware";

export const authRouter = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication and session management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - phone
 *               - password
 *               - confirmPassword
 *               - acceptTerms
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: Yaji
 *               last_name:
 *                 type: string
 *                 example: NONFON
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yaji@example.com
 *               phone:
 *                 type: string
 *                 example: "22997000000"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               acceptTerms:
 *                 type: boolean
 *                 example: true
 *               referralCode:
 *                 type: string
 *                 example: REF-ABC123
 *               deviceName:
 *                 type: string
 *                 example: iPhone 14
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid data
 *       409:
 *         description: Email already in use
 */
authRouter.post("/register", validate(SignUpDto), AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yaji@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               rememberMe:
 *                 type: boolean
 *                 example: false
 *               deviceName:
 *                 type: string
 *                 example: Web Chrome
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 */
authRouter.post("/login", validate(SignInDto), AuthController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 */
authRouter.post(
  "/logout",
  authenticateUser,
  protectedRoute,
  AuthController.logout,
);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request a password reset code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yaji@example.com
 *     responses:
 *       200:
 *         description: Reset code sent if account exists
 *       429:
 *         description: Too many requests — wait 1 minute
 */
authRouter.post(
  "/forgot-password",
  validate(ForgotPasswordDto),
  AuthController.forgotPassword,
);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     summary: Verify a password reset code
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yaji@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Code verified successfully
 *       400:
 *         description: Invalid or expired code
 */
authRouter.post(
  "/verify-reset-code",
  validate(VerifyResetCodeDto),
  AuthController.verifyResetCode,
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - code
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: yaji@example.com
 *               code:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: newpassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired code
 */
authRouter.post(
  "/reset-password",
  validate(ResetPasswordDto),
  AuthController.resetPassword,
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: abc123...
 *     responses:
 *       200:
 *         description: New access token generated
 *       401:
 *         description: Invalid or expired token
 */
authRouter.post(
  "/refresh-token",
  validate(RefreshTokenDto),
  AuthController.refreshAccessToken,
);
