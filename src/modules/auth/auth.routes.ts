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

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion des sessions
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
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
 *                 example: motdepasse123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: motdepasse123
 *               acceptTerms:
 *                 type: boolean
 *                 example: true
 *               referralCode:
 *                 type: string
 *                 example: MP-ABC123
 *               deviceName:
 *                 type: string
 *                 example: iPhone 14
 *     responses:
 *       201:
 *         description: Inscription réussie
 *       400:
 *         description: Données invalides
 *       409:
 *         description: Email déjà utilisé
 */
router.post("/register", validate(SignUpDto), AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
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
 *                 example: motdepasse123
 *               rememberMe:
 *                 type: boolean
 *                 example: false
 *               deviceName:
 *                 type: string
 *                 example: Web Chrome
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Email ou mot de passe incorrect
 */
router.post("/login", validate(SignInDto), AuthController.login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion de l'utilisateur
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
router.post("/logout", authenticateUser, protectedRoute, AuthController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Demande de réinitialisation du mot de passe
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
 *         description: Code envoyé si le compte existe
 *       429:
 *         description: Trop de requêtes — attendre 1 minute
 */
router.post(
  "/forgot-password",
  validate(ForgotPasswordDto),
  AuthController.forgotPassword,
);

/**
 * @swagger
 * /auth/verify-reset-code:
 *   post:
 *     summary: Vérification du code de réinitialisation
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
 *         description: Code vérifié avec succès
 *       400:
 *         description: Code invalide ou expiré
 */
router.post(
  "/verify-reset-code",
  validate(VerifyResetCodeDto),
  AuthController.verifyResetCode,
);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialisation du mot de passe
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
 *                 example: nouveaumotdepasse123
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Code invalide ou expiré
 */
router.post(
  "/reset-password",
  validate(ResetPasswordDto),
  AuthController.resetPassword,
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Renouvellement du token d'accès
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
 *         description: Nouveau token généré
 *       401:
 *         description: Token invalide ou expiré
 */
router.post(
  "/refresh-token",
  validate(RefreshTokenDto),
  AuthController.refreshAccessToken,
);

export default router;
