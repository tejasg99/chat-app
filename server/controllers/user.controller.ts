import { Request, Response } from "express";
import {
  getProfileService,
  updateProfileService,
  blockUserService,
  unblockUserService,
} from "../services/user.service.ts";
import { updateProfileSchema } from "../validations/user.validation.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";
import { createApiResponse } from "../utils/ApiResponse.ts";

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
