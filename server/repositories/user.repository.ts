import { User } from "../models/user.model.ts";
import type { IUser, UpdateProfileInput } from "../types/index.ts";

export const findUserByIdFull = async (id: string): Promise<IUser | null> =>
  User.findById(id).exec();

export const updateUserById = async (
  id: string,
  update: UpdateProfileInput,
): Promise<IUser | null> =>
  User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();

export const setUserOnlineStatus = async (userId: string, isOnline: boolean): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    isOnline,
    ...(!isOnline && { lastSeen: new Date() }),
  }).exec();
};

export const blockUser = async (userId: string, targetId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $addToSet: { blockedUsers: targetId },
  }).exec();
};

export const unblockUser = async (userId: string, targetId: string): Promise<void> => {
  await User.findByIdAndUpdate(userId, {
    $pull: { blockedUsers: targetId },
  }).exec();
};
