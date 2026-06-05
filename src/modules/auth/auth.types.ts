import { Role } from "../../../generated/prisma/enums";

export interface SignUpInput {
  first_name: string;
  last_name: string;
  email: string;
  referralCode?: string;
  phone: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: Role;
  referralCode: string | null;
  is_active: boolean;
  acceptTerms: boolean;
  created_at: Date;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}
