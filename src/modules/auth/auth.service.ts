import bcrypt from "bcryptjs";
import { addDays } from "date-fns";
import {
  generateAccessToken,
  generateRefreshToken,
  getTokenExpiry,
} from "./domain/token-generator";
import {
  resolveRole,
  isRateLimited,
  isTokenExpired,
} from "./domain/auth-policy";
import * as AuthRepository from "./auth.repository";
import type {
  SignUpDtoType,
  SignInDtoType,
  ForgotPasswordDtoType,
  VerifyResetCodeDtoType,
  ResetPasswordDtoType,
  RefreshTokenDtoType,
} from "./auth.dto";
import {
  BadRequestException,
  ConflictException,
  TooManyRequestsException,
  UnauthorizedException,
} from "../../shared/errors/http-errors";
import { generateUniquePublicId } from "../../shared/utils/generatePublicId";
import { generateAndHashResetCode } from "../../shared/utils/generateCode";
import { sendEmail } from "../../infrastructure/email/email.service";

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────

export const register = async (data: SignUpDtoType, ipAddress?: string) => {
  const existingUser = await AuthRepository.findUserByEmail(data.email);

  if (existingUser) {
    throw new ConflictException("Cet email est déjà utilisé.");
  }

  const role = resolveRole(data.email, data.first_name);
  const password_hash = await bcrypt.hash(data.password, 10);
  const publicId = await generateUniquePublicId("MP");
  const referralCode = await generateUniquePublicId("REF");

  const newUser = await AuthRepository.createUser({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone: data.phone,
    password_hash,
    role,
    acceptTerms: data.acceptTerms,
    referralCode,
    publicId,
  });

  const { accessTokenExpiry, refreshTokenExpiryDays, cookieMaxAge } =
    getTokenExpiry(false);

  const accessToken = generateAccessToken(
    { userId: newUser.id, email: newUser.email, role: newUser.role },
    accessTokenExpiry,
  );

  const refreshToken = generateRefreshToken();

  await AuthRepository.createSession({
    userId: newUser.id,
    refreshToken,
    deviceName: data.deviceName,
    ipAddress,
    expiresAt: addDays(new Date(), refreshTokenExpiryDays),
  });

  return {
    accessToken,
    refreshToken,
    cookieMaxAge,
    user: {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.first_name,
    },
  };
};

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────

export const login = async (data: SignInDtoType, ipAddress?: string) => {
  const user = await AuthRepository.findUserByEmail(data.email);

  if (!user || !user.password_hash) {
    throw new UnauthorizedException("Email ou mot de passe incorrect.");
  }

  const isMatch = await bcrypt.compare(data.password, user.password_hash);

  if (!isMatch) {
    throw new UnauthorizedException("Email ou mot de passe incorrect.");
  }

  const rememberMe = data.rememberMe ?? false;
  const { accessTokenExpiry, refreshTokenExpiryDays, cookieMaxAge } =
    getTokenExpiry(rememberMe);

  const accessToken = generateAccessToken(
    { userId: user.id, email: user.email, role: user.role },
    accessTokenExpiry,
  );

  const refreshToken = generateRefreshToken();

  await AuthRepository.createSession({
    userId: user.id,
    refreshToken,
    deviceName: data.deviceName,
    ipAddress,
    expiresAt: addDays(new Date(), refreshTokenExpiryDays),
  });

  return {
    accessToken,
    refreshToken,
    cookieMaxAge,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.first_name,
      role: user.role,
    },
  };
};

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────

export const logout = async (refreshToken: string) => {
  await AuthRepository.deleteSessionByRefreshToken(refreshToken);
};

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────

export const forgotPassword = async (data: ForgotPasswordDtoType) => {
  const user = await AuthRepository.findUserByEmail(data.email);

  // Message générique pour sécurité — pas d'énumération user
  if (!user) return;

  const recentRequest = await AuthRepository.findRecentResetRequest(user.id);

  if (recentRequest && isRateLimited(recentRequest.created_at)) {
    throw new TooManyRequestsException(
      "Veuillez patienter 1 minute avant de demander un nouveau code.",
    );
  }

  await AuthRepository.deleteAllResetTokens(user.id);

  const { code, hashed } = await generateAndHashResetCode();

  await AuthRepository.createResetToken(user.id, hashed);

  const subject = "Code de réinitialisation du mot de passe";
  const html = `
    <p>Bonjour ${user.first_name ?? ""},</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Voici votre code :</p>
    <h2 style="color:#007bff;">${code}</h2>
    <p>Ce code expirera dans 10 minutes.</p>
    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `;

  await sendEmail(user.email, subject, html);
};

// ─────────────────────────────────────────
// VERIFY RESET CODE
// ─────────────────────────────────────────

export const verifyResetCode = async (data: VerifyResetCodeDtoType) => {
  const user = await AuthRepository.findUserByEmail(data.email);

  if (!user) {
    throw new BadRequestException("Code ou email invalide.");
  }

  const resetToken = await AuthRepository.findLatestResetToken(user.id);

  if (!resetToken) {
    throw new BadRequestException("Code invalide ou expiré.");
  }

  if (resetToken.used) {
    throw new BadRequestException("Ce code a déjà été utilisé.");
  }

  if (isTokenExpired(resetToken.expires_at)) {
    throw new BadRequestException("Ce code a expiré.");
  }

  const isMatch = await bcrypt.compare(data.code, resetToken.hashed_token);

  if (!isMatch) {
    throw new BadRequestException("Code invalide.");
  }
};

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────

export const resetPassword = async (data: ResetPasswordDtoType) => {
  const user = await AuthRepository.findUserByEmail(data.email);

  if (!user) {
    throw new BadRequestException("Code ou email invalide.");
  }

  const resetToken = await AuthRepository.findLatestResetToken(user.id);

  if (!resetToken) {
    throw new BadRequestException("Code invalide ou expiré.");
  }

  if (resetToken.used) {
    throw new BadRequestException("Ce code a déjà été utilisé.");
  }

  if (isTokenExpired(resetToken.expires_at)) {
    throw new BadRequestException("Ce code a expiré.");
  }

  const isMatch = await bcrypt.compare(data.code, resetToken.hashed_token);

  if (!isMatch) {
    throw new BadRequestException("Code invalide.");
  }

  const password_hash = await bcrypt.hash(data.newPassword, 10);

  await AuthRepository.updateUserPassword(user.id, password_hash);
  await AuthRepository.markResetTokenAsUsed(resetToken.id);
};

// ─────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────

export const refreshAccessToken = async (data: RefreshTokenDtoType) => {
  const session = await AuthRepository.findSessionByRefreshToken(
    data.refreshToken,
  );

  if (!session || isTokenExpired(session.expiresAt)) {
    throw new UnauthorizedException("Token invalide ou expiré.");
  }

  const accessToken = generateAccessToken(
    {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role,
    },
    "1d",
  );

  await AuthRepository.updateSessionLastUsed(session.id);

  return { accessToken };
};
