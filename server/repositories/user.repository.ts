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

// ─── User Search ──────────────────────────────────────────────────────────────
// Searches name + email using MongoDB text index
// Excludes:
//   - The searching user themselves
//   - Users who have been blocked by the searching user
//   - Users who are system-blocked (isBlocked: true)
//   - Sensitive fields (password, refreshToken excluded by default via select:false)
export const searchUsers = async (
  query: string,
  currentUserId: string,
  blockedUserIds: string[],
  limit: number,
): Promise<IUser[]> =>
  User.find(
    {
      $text: { $search: query },
      _id: {
        $ne: currentUserId,
        // Exclude users the current user has blocked
        ...(blockedUserIds.length > 0 && { $nin: blockedUserIds }),
      },
      isBlocked: false,
    },
    // Project the text score so we can sort by relevance
    { score: { $meta: "textScore" } },
  )
    .select("name email avatar isOnline lastSeen")
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean<IUser[]>()
    .exec();
