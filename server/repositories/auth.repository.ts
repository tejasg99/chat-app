import { userRepository } from "./user.repository";
import type { IUser } from "../models/user.model";
import { AuthProvider } from "../models/user.model";

/**
 * Auth-specific DB operations.
 * Delegates to userRepository — keeps auth concerns separate.
 */
export class AuthRepository {
  /**
   * Find user with credentials for login.
   */
  async findUserForLogin(email: string): Promise<IUser | null> {
    return userRepository.findByEmailWithCredentials(email);
  }

  /**
   * Create a local (email+password) user.
   */
  async createLocalUser(data: { name: string; email: string; password: string }): Promise<IUser> {
    return userRepository.create({
      ...data,
      authProvider: AuthProvider.LOCAL,
      isVerified: false,
    });
  }

  /**
   * Find or create a Google OAuth user.
   * Returns the user and whether they were just created.
   */
  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    avatar?: string;
  }): Promise<{ user: IUser; isNew: boolean }> {
    // Check if user already signed up with Google
    let user = await userRepository.findByGoogleId(profile.googleId);

    if (user) {
      return { user, isNew: false };
    }

    // Check if email already exists with local auth
    user = await userRepository.findByEmail(profile.email);

    if (user) {
      // Link Google to existing account
      user.googleId = profile.googleId;
      user.authProvider = AuthProvider.GOOGLE;
      user.isVerified = true;
      if (!user.avatar && profile.avatar) {
        user.avatar = profile.avatar;
      }
      await user.save();
      return { user, isNew: false };
    }

    // Create brand new Google user
    const newUser = await userRepository.create({
      name: profile.name,
      email: profile.email,
      googleId: profile.googleId,
      avatar: profile.avatar,
      authProvider: AuthProvider.GOOGLE,
      isVerified: true, // Google emails are verified
    });

    return { user: newUser, isNew: true };
  }
}

export const authRepository = new AuthRepository();
