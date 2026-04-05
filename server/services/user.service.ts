import { ApiError } from "../utils/ApiError.ts";
import {
  findUserByIdFull,
  updateUserById,
  setUserOnlineStatus,
  blockUser,
  unblockUser,
} from "../repositories/user.repository.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import { getCache, setCache, deleteCache, CACHE_TTL } from "../config/redis.ts";
import type { IUser, UpdateProfileInput } from "../types/index.ts";

// ─── Cache key factory — keeps key format consistent ──────────────────────────
const userCacheKey = (userId: string) => `user:profile:${userId}`;

export const getProfileService = async (userId: string): Promise<IUser> => {
  // Check Redis cache first
  const cached = await getCache<IUser>(userCacheKey(userId));
  if (cached) return cached;

  const user = await findUserByIdFull(userId);
  if (!user) throw new ApiError(404, "User not found");

  // Hydrate the cache for subsequent requests
  await setCache(userCacheKey(userId), user, CACHE_TTL.USER_PROFILE);

  return user;
};

export const updateProfileService = async (
  userId: string,
  update: UpdateProfileInput,
): Promise<IUser> => {
  const user = await updateUserById(userId, update);
  if (!user) throw new ApiError(404, "User not found");

  // Bust the cache so the next getProfile call fetches fresh data
  await deleteCache(userCacheKey(userId));

  return user;
};

export const setOnlineStatusService = async (userId: string, isOnline: boolean): Promise<void> => {
  await setUserOnlineStatus(userId, isOnline);
};

export const blockUserService = async (userId: string, targetId: string): Promise<void> => {
  if (userId === targetId) throw new ApiError(400, "Cannot block yourself");

  const target = await findUserById(targetId);
  if (!target) throw new ApiError(404, "User to block not found");

  await blockUser(userId, targetId);

  // Bust cache for the blocking user since blockedUsers array changed
  await deleteCache(userCacheKey(userId));
};

export const unblockUserService = async (userId: string, targetId: string): Promise<void> => {
  await unblockUser(userId, targetId);
  await deleteCache(userCacheKey(userId));
};
