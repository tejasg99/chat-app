import type { Request, Response, NextFunction } from "express";
import { userService } from "../services/user.service";
import { sendSuccess } from "../utils/ApiResponse";
import type { UpdateProfileInput } from "../validations/user.validation";

export class UserController {
  /**
   * GET /api/users/me
   * Returns authenticated user's own profile.
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.getMyProfile(req.user!._id);
      sendSuccess(res, "Profile fetched successfully.", user, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/users/me
   * Updates authenticated user's profile.
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as UpdateProfileInput;
      const updatedUser = await userService.updateProfile(req.user!._id.toString(), body);
      sendSuccess(res, "Profile updated successfully.", updatedUser, 200);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/users/:userId
   * Returns a user's public profile.
   */
  async getUserProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const user = await userService.getProfile(userId as string);
      sendSuccess(res, "User profile fetched successfully.", user, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
