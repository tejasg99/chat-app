import type { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import type { SignupInput, LoginInput } from "../validations/auth.validation";
import type { IUser } from "../models/user.model";

/**
 * Auth Controller — only handles HTTP request/response.
 * All business logic lives in authService.
 */
export class AuthController {
  /**
   * POST /api/auth/signup
   */
  async signup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as SignupInput;
      const result = await authService.signup(body, res);

      sendSuccess(res, "Account created successfully.", result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as LoginInput;
      const result = await authService.login(body, res);

      sendSuccess(res, "Logged in successfully.", result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/refresh-token
   * Reads refresh token from HTTP-only cookie.
   */
  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        throw ApiError.unauthorized("No refresh token provided.");
      }

      const result = await authService.refreshAccessToken(refreshToken, res);
      sendSuccess(res, "Access token refreshed.", result, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout
   * Requires authentication.
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken as string | undefined;

      if (!refreshToken) {
        throw ApiError.badRequest("No refresh token found.");
      }

      await authService.logout(req.user!._id.toString(), refreshToken, res);
      sendSuccess(res, "Logged out successfully.", null, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/auth/logout-all
   * Logs out from all devices.
   */
  async logoutAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.logoutAll(req.user!._id.toString(), res);
      sendSuccess(res, "Logged out from all devices.", null, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/google/callback
   * Handles the Google OAuth callback.
   */
  async googleCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const googleUser = req.user as IUser;

      if (!googleUser) {
        throw ApiError.unauthorized("Google authentication failed.");
      }

      const result = await authService.handleGoogleCallback(
        {
          googleId: googleUser.googleId!,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
        },
        res,
      );

      // Redirect to client with access token as query param
      // In production, consider a more secure handoff
      const clientUrl = process.env.CLIENT_URL ?? "http://localhost:3000";
      res.redirect(`${clientUrl}/auth/callback?token=${result.accessToken}`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/auth/me
   * Returns the currently authenticated user.
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      sendSuccess(res, "Authenticated user fetched.", req.user!.toSafeObject(), 200);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
