import { userRepository } from "../repositories/user.repository";
import { ApiError } from "../utils/ApiError";
import type { IUser } from "../models/user.model";
import type { UpdateProfileInput } from "../validations/user.validation";

export class UserService {
  /**
   * Get a user's public profile by ID.
   */
  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    return user;
  }

  /**
   * Get the currently authenticated user's own profile.
   */
  async getMyProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw ApiError.notFound("User not found.");
    }

    return user;
  }

  /**
   * Update the currently authenticated user's profile.
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser> {
    // Ensure there's actually something to update
    const hasFields = Object.values(data).some((v) => v !== undefined && v !== null);

    if (!hasFields) {
      throw ApiError.badRequest("No valid fields provided for update.");
    }

    const updatedUser = await userRepository.updateProfile(userId, data);

    if (!updatedUser) {
      throw ApiError.notFound("User not found.");
    }

    return updatedUser;
  }

  /**
   * Update a user's online presence.
   * Called by Socket.io events (Iteration 5).
   */
  async setPresence(userId: string, isOnline: boolean): Promise<void> {
    await userRepository.updatePresence(userId, isOnline);
  }
}

export const userService = new UserService();
