import jwt, { SignOptions } from "jsonwebtoken";
import { randomBytes } from "crypto";
import { JwtPayload } from "../auth.types";

const JWT_SECRET = process.env.JWT as string;

export const generateAccessToken = (
  payload: JwtPayload,
  expiresIn: SignOptions["expiresIn"] = "1d",
): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const generateRefreshToken = (): string => {
  return randomBytes(64).toString("hex");
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

export const getTokenExpiry = (
  rememberMe: boolean,
): {
  accessTokenExpiry: SignOptions["expiresIn"];
  refreshTokenExpiryDays: number;
  cookieMaxAge: number;
} => {
  return rememberMe
    ? {
        accessTokenExpiry: "30d",
        refreshTokenExpiryDays: 30,
        cookieMaxAge: 30 * 24 * 60 * 60 * 1000,
      }
    : {
        accessTokenExpiry: "1d",
        refreshTokenExpiryDays: 7,
        cookieMaxAge: 24 * 60 * 60 * 1000,
      };
};
