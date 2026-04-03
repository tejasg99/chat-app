import { ApiError } from "../utils/ApiError.ts";
import {
  findUserByIdFull,
  updateUserById,
  setUserOnlineStatus,
  blockUser,
  unblockUser,
} from "../repositories/user.repository.ts";
import { findUserById } from "../repositories/auth.repository.ts";
import type { IUser, UpdateProfileInput } from "../types/index.ts";

export const getProfileService = async (userId: string): Promise<IUser> => {
  const user = await findUserByIdFull(userId);
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

export const updateProfileService = async (
  userId: string,
  update: UpdateProfileInput,
): Promise<IUser> => {
  const user = await updateUserById(userId, update);
  if (!user) throw new ApiError(404, "User not found");
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
};

export const unblockUserService = async (userId: string, targetId: string): Promise<void> => {
  await unblockUser(userId, targetId);
};
