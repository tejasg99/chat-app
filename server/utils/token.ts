import jwt from "jsonwebtoken";
import { env } from "../config/env.ts";
import type { JwtAccessPayload, JwtRefreshPayload, TokenPair } from "../types/index.ts";

export const generateAccessToken = (payload: JwtAccessPayload): string =>
  jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  } as jwt.SignOptions);

export const generateRefreshToken = (payload: JwtRefreshPayload): string =>
  jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  } as jwt.SignOptions);

export const generateTokenPair = (userId: string, email: string): TokenPair => ({
  accessToken: generateAccessToken({ userId, email }),
  refreshToken: generateRefreshToken({ userId }),
});

export const verifyAccessToken = (token: string): JwtAccessPayload =>
  jwt.verify(token, env.jwtAccessSecret) as JwtAccessPayload;

export const verifyRefreshToken = (token: string): JwtRefreshPayload =>
  jwt.verify(token, env.jwtRefreshSecret) as JwtRefreshPayload;
