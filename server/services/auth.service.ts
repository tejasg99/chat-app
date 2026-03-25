import { authRepository } from "../repositories/auth.repository";
import { userRepository } from "../repositories/user.repository";
import { generateTokenPair, verifyRefreshToken, refreshTokenCookieOptions } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import type { SignupInput, LoginInput } from "../validations/auth.validation";
import type { IUser } from "../models/user.model";
import type { Response } from "express";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: ReturnType<IUser["toSafeObject"]>;
  accessToken: string;
}

export class AuthService {
  /**
   * Signs the refresh token into an HTTP-only cookie
   * and returns the access token for the response body.
   */
  private async issueTokens(
    userId: string,
    email: string,
    role: string,
    res: Response,
  ): Promise<string> {
    const { accessToken, refreshToken } = generateTokenPair(userId, email, role);

    // Calculate expiry (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Persist refresh token in DB
    await userRepository.addRefreshToken(userId, refreshToken, expiresAt);

    // Set HTTP-only cookie
    res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions);

    return accessToken;
  }

  // Signup

  async signup(data: SignupInput, res: Response): Promise<AuthResult> {
    const { name, email, password } = data;

    // Check for duplicate email
    const emailTaken = await userRepository.existsByEmail(email);
    if (emailTaken) {
      throw ApiError.conflict("An account with this email already exists.");
    }

    // Create user (password hashed via pre-save hook)
    const user = await authRepository.createLocalUser({ name, email, password });

    // Issue tokens
    const accessToken = await this.issueTokens(user._id.toString(), user.email, user.role, res);

    return {
      user: user.toSafeObject(),
      accessToken,
    };
  }

  // Login

  async login(data: LoginInput, res: Response): Promise<AuthResult> {
    const { email, password } = data;

    // Find user (with password selected)
    const user = await authRepository.findUserForLogin(email);

    if (!user) {
      // Generic message to prevent user enumeration
      throw ApiError.unauthorized("Invalid email or password.");
    }

    // Check if account is blocked
    if (user.isBlocked) {
      throw ApiError.forbidden("Your account has been suspended.");
    }

    // Check auth provider
    if (user.authProvider !== "local" || !user.password) {
      throw ApiError.badRequest(
        `This account uses ${user.authProvider} sign-in. Please use that instead.`,
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    // Issue tokens
    const accessToken = await this.issueTokens(user._id.toString(), user.email, user.role, res);

    return {
      user: user.toSafeObject(),
      accessToken,
    };
  }

  // Refresh Token

  async refreshAccessToken(
    incomingRefreshToken: string,
    res: Response,
  ): Promise<{ accessToken: string }> {
    // Verify token signature + expiry
    const decoded = verifyRefreshToken(incomingRefreshToken);

    // Check DB for token (rotation check)
    const user = await userRepository.findByRefreshToken(incomingRefreshToken);

    if (!user) {
      // Token not in DB — possible reuse attack
      // Revoke all tokens for this user as a security measure
      await userRepository.removeAllRefreshTokens(decoded.userId);
      throw ApiError.unauthorized("Refresh token reuse detected. Please log in again.");
    }

    // Remove old token (rotation)
    await userRepository.removeRefreshToken(user._id.toString(), incomingRefreshToken);

    // Issue new token pair
    const accessToken = await this.issueTokens(user._id.toString(), user.email, user.role, res);

    return { accessToken };
  }

  // Logout

  async logout(userId: string, refreshToken: string, res: Response): Promise<void> {
    // Remove the specific refresh token from DB
    await userRepository.removeRefreshToken(userId, refreshToken);

    // Clear the cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });
  }

  // Logout All Devices

  async logoutAll(userId: string, res: Response): Promise<void> {
    await userRepository.removeAllRefreshTokens(userId);

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });
  }

  // Google OAuth

  async handleGoogleCallback(
    googleProfile: {
      googleId: string;
      email: string;
      name: string;
      avatar?: string;
    },
    res: Response,
  ): Promise<AuthResult> {
    const { user } = await authRepository.findOrCreateGoogleUser(googleProfile);

    if (user.isBlocked) {
      throw ApiError.forbidden("Your account has been suspended.");
    }

    const accessToken = await this.issueTokens(user._id.toString(), user.email, user.role, res);

    return {
      user: user.toSafeObject(),
      accessToken,
    };
  }
}

export const authService = new AuthService();
