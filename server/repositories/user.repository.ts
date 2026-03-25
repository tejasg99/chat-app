import mongoose from "mongoose";
import User from "../models/user.model";
import type { IUser } from "../models/user.model";
import type { UpdateProfileInput } from "../validations/user.validation";

/**
 * All direct MongoDB interactions for the User model live here.
 * Services call repositories — never the model directly.
 */
export class UserRepository {
  /**
   * Find a user by their MongoDB _id.
   */
  async findById(userId: string): Promise<IUser | null> {
    return User.findById(userId).select("-password -refreshTokens");
  }

  /**
   * Find a user by email.
   * Selects password + refreshTokens for auth operations.
   */
  async findByEmailWithCredentials(email: string): Promise<IUser | null> {
    return User.findByEmail(email); // uses static method
  }

  /**
   * Find by email without sensitive fields.
   */
  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase().trim() });
  }

  /**
   * Find by Google ID for OAuth flow.
   */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  /**
   * Create a new user.
   */
  async create(data: Partial<IUser>): Promise<IUser> {
    const user = new User(data);
    return user.save();
  }

  /**
   * Update a user's profile fields.
   */
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true },
    ).select("-password -refreshTokens");
  }

  /**
   * Push a new refresh token into the user's refreshTokens array.
   */
  async addRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $push: {
        refreshTokens: { token, expiresAt },
      },
    });
  }

  /**
   * Remove a specific refresh token (logout).
   */
  async removeRefreshToken(userId: string, token: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: { token } },
    });
  }

  /**
   * Remove all refresh tokens for a user (logout all devices).
   */
  async removeAllRefreshTokens(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: { refreshTokens: [] },
    });
  }

  /**
   * Update online presence and lastSeen timestamp.
   */
  async updatePresence(userId: string, isOnline: boolean): Promise<void> {
    await User.findByIdAndUpdate(userId, {
      $set: {
        isOnline,
        lastSeen: new Date(),
      },
    });
  }

  /**
   * Find a user by their refresh token value.
   * Used during token refresh.
   */
  async findByRefreshToken(token: string): Promise<IUser | null> {
    return User.findOne({
      "refreshTokens.token": token,
      "refreshTokens.expiresAt": { $gt: new Date() }, // ensure not expired
    }).select("+refreshTokens");
  }

  /**
   * Check if a user with the given email already exists.
   */
  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({
      email: email.toLowerCase().trim(),
    });
    return count > 0;
  }

  /**
   * Get multiple users by their IDs.
   * Useful for group chat member lookups.
   */
  async findManyByIds(userIds: mongoose.Types.ObjectId[]): Promise<IUser[]> {
    return User.find({ _id: { $in: userIds } }).select("-password -refreshTokens");
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
