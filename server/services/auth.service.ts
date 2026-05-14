import bcrypt from "bcrypt";
import { ApiError } from "../utils/ApiError.ts";
import { generateTokenPair, verifyRefreshToken } from "../utils/token.ts";
import {
  findUserByEmail,
  findUserById,
  findUserByRefreshToken,
  createUser,
  updateUserRefreshToken,
} from "../repositories/auth.repository.ts";
import { setUserOnlineStatus } from "../repositories/user.repository.ts";
import { removeOnlineUser } from "../config/redis.ts";
import type { SignupInput, LoginInput, TokenPair, IUser } from "../types/index.ts";

// ─── Signup ───────────────────────────────────────────────────────────────────

export const signupService = async (
  data: SignupInput,
): Promise<{ user: IUser; tokens: TokenPair }> => {
  const existing = await findUserByEmail(data.email);
  if (existing) {
    throw new ApiError(409, "Email already in use");
  }

  const user = (await createUser(data)) as IUser;
  const tokens = generateTokenPair(user._id.toString(), user.email);

  await updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

  return { user, tokens };
};

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginService = async (
  data: LoginInput,
): Promise<{ user: IUser; tokens: TokenPair }> => {
  const user = await findUserByEmail(data.email, true);
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (!user.password) {
    throw new ApiError(401, "Please use Google login for this account");
  }

  const isMatch = await bcrypt.compare(data.password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isBlocked) {
    throw new ApiError(403, "Your account has been blocked");
  }

  const tokens = generateTokenPair(user._id.toString(), user.email);
  await updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

  return { user, tokens };
};

// ─── Refresh Token ────────────────────────────────────────────────────────────

export const refreshTokenService = async (incomingRefreshToken: string): Promise<TokenPair> => {
  let payload;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await findUserByRefreshToken(incomingRefreshToken);
  if (!user) {
    throw new ApiError(401, "Refresh token has been revoked");
  }

  if (user._id.toString() !== payload.userId) {
    throw new ApiError(401, "Token mismatch");
  }

  const tokens = generateTokenPair(user._id.toString(), user.email);
  await updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

  return tokens;
};

// ─── Logout ───────────────────────────────────────────────────────────────────

export const logoutService = async (userId: string): Promise<void> => {
  // Clear the refresh token so no new access tokens can be minted
  await updateUserRefreshToken(userId, null);

  // Mark the user offline in MongoDB + Redis so other users see the correct
  // status even if the WebSocket disconnect event doesn't fire (e.g. the
  // browser unloads before the close frame is sent).
  await Promise.all([setUserOnlineStatus(userId, false), removeOnlineUser(userId)]);
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────

export const googleAuthService = async (profile: {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<{ user: IUser; tokens: TokenPair }> => {
  let user = await findUserByEmail(profile.email);

  if (!user) {
    user = (await createUser({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      avatar: profile.avatar,
    })) as IUser;
  } else if (!user.googleId) {
    // Link Google to existing account
    await findUserById(user._id.toString());
    user = (await import("../models/user.model.ts").then(({ User }) =>
      User.findByIdAndUpdate(user!._id, { googleId: profile.googleId }, { new: true }),
    )) as IUser;
  }

  const tokens = generateTokenPair(user._id.toString(), user.email);
  await updateUserRefreshToken(user._id.toString(), tokens.refreshToken);

  return { user, tokens };
};
