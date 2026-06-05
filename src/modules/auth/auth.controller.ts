import { Request, Response, NextFunction } from "express";
import * as AuthService from "./auth.service";
import type {
  SignUpDtoType,
  SignInDtoType,
  ForgotPasswordDtoType,
  VerifyResetCodeDtoType,
  ResetPasswordDtoType,
  RefreshTokenDtoType,
} from "./auth.dto";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
  path: "/",
};

// ─────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as SignUpDtoType;
    const ipAddress = req.ip;

    const result = await AuthService.register(body, ipAddress);

    res.cookie("token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: result.cookieMaxAge,
    });

    res.cookie("refreshToken", result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: result.cookieMaxAge,
    });

    return res.status(201).json({
      message: "Inscription réussie !",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as SignInDtoType;
    const ipAddress = req.ip;

    const result = await AuthService.login(body, ipAddress);

    res.cookie("token", result.accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: result.cookieMaxAge,
    });

    res.cookie("refreshToken", result.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: result.cookieMaxAge,
    });

    return res.status(200).json({
      message: "Connexion réussie.",
      token: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await AuthService.logout(refreshToken);
    }

    res.clearCookie("token", COOKIE_OPTIONS);
    res.clearCookie("refreshToken", COOKIE_OPTIONS);

    return res.status(200).json({ message: "Déconnexion réussie." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────

export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as ForgotPasswordDtoType;

    await AuthService.forgotPassword(body);

    return res.status(200).json({
      message:
        "Si un compte existe, un code de réinitialisation a été envoyé à votre email.",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// VERIFY RESET CODE
// ─────────────────────────────────────────

export const verifyResetCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as VerifyResetCodeDtoType;

    await AuthService.verifyResetCode(body);

    return res.status(200).json({ message: "Code vérifié avec succès." });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// RESET PASSWORD
// ─────────────────────────────────────────

export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as ResetPasswordDtoType;

    await AuthService.resetPassword(body);

    return res.status(200).json({
      message: "Mot de passe réinitialisé avec succès !",
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────
// REFRESH ACCESS TOKEN
// ─────────────────────────────────────────

export const refreshAccessToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as RefreshTokenDtoType;

    const result = await AuthService.refreshAccessToken(body);

    return res.status(200).json({ accessToken: result.accessToken });
  } catch (error) {
    next(error);
  }
};
