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
import type { ServerToClientEvents } from "../types/index.ts";
import type { Server } from "socket.io";

// The io instance is injected so the logout handler can broadcast user:offline
let ioInstance: Server<ServerToClientEvents> | null = null;

export const setAuthIoInstance = (io: Server): void => {
  ioInstance = io as Server<ServerToClientEvents>;
};

const cookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax" as const,
};

// Detect native clients
const isMobileClient = (req: Request) => {
  return req.headers["x-client-type"] === "mobile";
};

// ─── Signup ───────────────────────────────────────────────────────────────────
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const parsed = signupSchema.safeParse(req.body);

  if (!parsed.success) {
    throw parsed.error;
  }

  const { user, tokens } = await signupService(parsed.data);

  const mobileClient = isMobileClient(req);

  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  const responseData: Record<string, unknown> = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
    accessToken: tokens.accessToken,
  };

  // Only expose refresh token to mobile apps
  if (mobileClient) {
    responseData.refreshToken = tokens.refreshToken;
  }

  res.status(201).json(createApiResponse(201, "Account created successfully", responseData));
});

// ─── Login ────────────────────────────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) throw parsed.error;

  const { user, tokens } = await loginService(parsed.data);

  const mobileClient = isMobileClient(req);

  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  const responseData: Record<string, unknown> = {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
    accessToken: tokens.accessToken,
  };

  // Only expose refresh token to mobile apps
  if (mobileClient) {
    responseData.refreshToken = tokens.refreshToken;
  }

  res.status(200).json(createApiResponse(200, "Login successful", responseData));
});

// ─── Refresh Token ────────────────────────────────────────────────────────────
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const incoming = req.cookies?.refreshToken ?? req.body?.refreshToken;

  if (!incoming) throw new ApiError(401, "Refresh token not provided");

  const tokens = await refreshTokenService(incoming);

  const mobileClient = isMobileClient(req);

  res
    .cookie("accessToken", tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  const responseData: Record<string, unknown> = {
    accessToken: tokens.accessToken,
  };

  // Only expose refresh token to mobile apps
  if (mobileClient) {
    responseData.refreshToken = tokens.refreshToken;
  }

  res.status(200).json(createApiResponse(200, "Tokens refreshed", responseData));
});

// ─── Logout ───────────────────────────────────────────────────────────────────
export const logout = asyncHandler(async (req: Request, res: Response) => {
  // req.user is IUser | undefined — typed correctly via namespace augmentation
  const userId = req.user!._id.toString();
  await logoutService(userId);

  // Broadcast offline status to all connected clients so they see the change
  // immediately, without waiting for the socket disconnect event (which may
  // not fire reliably on a hard page navigation).
  if (ioInstance) {
    ioInstance.emit("user:offline", { userId, lastSeen: new Date() });
  }

  res
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
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

  // Set cookies (for web client)
  res
    .cookie("accessToken", result.tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refreshToken", result.tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

  // Mobile clients pass ?platform=mobile via OAuth state param
  const platform = req.query.state === "mobile" ? "mobile" : "web";

  if (platform === "mobile") {
    // Redirect to the native app deep link with tokens as query params
    const deepLink = `chatapp://auth/success?accessToken=${encodeURIComponent(result.tokens.accessToken)}&refreshToken=${encodeURIComponent(result.tokens.refreshToken)}`;
    return res.redirect(deepLink);
  }

  // Default: redirect to web client
  res.redirect(`${env.clientUrl}/auth/success`);
});
