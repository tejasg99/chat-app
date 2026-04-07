import { Request, Response } from "express";
import {
  getProfileService,
  updateProfileService,
  blockUserService,
  unblockUserService,
  searchUsersService,
} from "../services/user.service.ts";
import { uploadAvatarService } from "../services/upload.service.ts";
import { updateProfileSchema, searchUsersSchema } from "../validations/user.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";
import { ApiError } from "../utils/ApiError.ts";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await getProfileService(req.user!._id.toString());

  res.status(200).json(createApiResponse(200, "Profile fetched", user));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) throw parsed.error;

  const user = await updateProfileService(req.user!._id.toString(), parsed.data);

  res.status(200).json(createApiResponse(200, "Profile updated", user));
});

// ─── POST /api/users/me/avatar — Upload a new avatar ─────────────────────────
export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw new ApiError(400, "No image file provided");

  const result = await uploadAvatarService(req.file.buffer);

  // Persist the new avatar URL to the user profile
  const user = await updateProfileService(req.user!._id.toString(), {
    avatar: result.url,
  });

  res.status(200).json(
    createApiResponse(200, "Avatar uploaded successfully", {
      avatar: user.avatar,
      upload: result,
    }),
  );
});

export const blockUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { targetId } = req.params;
  await blockUserService(req.user!._id.toString(), targetId as string);

  res.status(200).json(createApiResponse(200, "User blocked successfully"));
});

export const unblockUserHandler = asyncHandler(async (req: Request, res: Response) => {
  const { targetId } = req.params;
  await unblockUserService(req.user!._id.toString(), targetId as string);

  res.status(200).json(createApiResponse(200, "User unblocked successfully"));
});

// ─── GET /api/users/search?q=&limit= ─────────────────────────────────────────
// Searches users by name or email
// Excludes: self, blocked users, system-blocked accounts
// Returns: name, email, avatar, isOnline, lastSeen only (no sensitive fields)
export const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const parsed = searchUsersSchema.safeParse(req.query);
  if (!parsed.success) throw parsed.error;

  const users = await searchUsersService(
    parsed.data.q,
    req.user!._id.toString(),
    parsed.data.limit,
  );

  res.status(200).json(createApiResponse(200, "Search results", users));
});
