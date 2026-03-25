import jwt from "jsonwebtoken";
import { ApiError } from "./ApiError";

export interface AccessTokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

// Helpers to get env safely

const getAccessSecret = (): string => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error("JWT_ACCESS_SECRET is not defined");
  return secret;
};

const getRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("JWT_REFRESH_SECRET is not defined");
  return secret;
};

// Token generation

/**
 * Generates a short-lived access token (default: 15m).
 */
export const generateAccessToken = (payload: AccessTokenPayload): string => {
  return jwt.sign(payload, getAccessSecret(), {
    expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN ?? "15m") as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
};

/**
 * Generates a long-lived refresh token (default: 7d).
 */
export const generateRefreshToken = (payload: RefreshTokenPayload): string => {
  return jwt.sign(payload, getRefreshSecret(), {
    expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as jwt.SignOptions["expiresIn"],
    algorithm: "HS256",
  });
};

/**
 * Generates both tokens at once.
 */
export const generateTokenPair = (
  userId: string,
  email: string,
  role: string,
): { accessToken: string; refreshToken: string } => {
  const accessToken = generateAccessToken({ userId, email, role });
  const refreshToken = generateRefreshToken({ userId });
  return { accessToken, refreshToken };
};

// Token verification

/**
 * Verifies and decodes an access token.
 * Throws ApiError on failure.
 */
export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    return jwt.verify(token, getAccessSecret()) as AccessTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Access token has expired");
    }
    throw ApiError.unauthorized("Invalid access token");
  }
};

/**
 * Verifies and decodes a refresh token.
 * Throws ApiError on failure.
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, getRefreshSecret()) as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized("Refresh token has expired");
    }
    throw ApiError.unauthorized("Invalid refresh token");
  }
};

// Cookie config

/**
 * Standard cookie options for HTTP-only cookie storage.
 */
export const refreshTokenCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: "/api/auth", // Restrict cookie to auth routes only
};

export const clearCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
};
