import { Request, Response } from "express";
import {
  signupService,
  loginService,
  refreshTokenService,
  logoutService,
} from "../services/auth.service.ts";
import { signupSchema, loginSchema } from "../validations/auth.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";
import { ApiError } from "../utils/ApiError.ts";
import { env } from "../config/env.ts";

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "strict" as const,
};

// ─── Signup ───────────────────────────────────────────────────────────────────
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { user, tokens } = await signupService(parsed.data);

  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(201)
    .json(
      createApiResponse(201, "Account created successfully", {
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        accessToken: tokens.accessToken,
      }),
    );
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const { user, tokens } = await loginService(parsed.data);

  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json(
      createApiResponse(200, "Login successful", {
        user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar },
        accessToken: tokens.accessToken,
      }),
    );
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.cookies?.refreshToken ?? req.body?.refreshToken;
  if (!incoming) throw new ApiError(401, "Refresh token not provided");

  const tokens = await refreshTokenService(incoming);

  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json(createApiResponse(200, "Tokens refreshed", { accessToken: tokens.accessToken }));
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // req.user is IUser | undefined — typed correctly via namespace augmentation
  await logoutService(req.user!._id.toString());

  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .status(200)
    .json(createApiResponse(200, "Logged out successfully"));
});

// ─── Google Callback ──────────────────────────────────────────────────────────
export const googleCallback = asyncHandler(async (req: Request, res: Response) => {
  // Passport attaches the done() payload to req.user
  const result = req.user as unknown as {
    user: { _id: string };
    tokens: { accessToken: string; refreshToken: string };
  };

  if (!result?.tokens) throw new ApiError(401, "Google authentication failed");

  res
    .cookie("accessToken", result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .redirect(`${env.clientUrl}/auth/success`);
});
