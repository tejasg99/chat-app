import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { ApiError } from "../utils/ApiError";
import User from "../models/user.model";
import { UserRole } from "../models/user.model";

/**
 * Protects routes — verifies the JWT access token from the
 * Authorization header and attaches the user to req.user.
 */
export const protect = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw ApiError.unauthorized("No token provided. Please log in.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw ApiError.unauthorized("Malformed authorization header.");
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.userId).select("-password -refreshTokens");

    if (!user) {
      throw ApiError.unauthorized("User no longer exists.");
    }

    // Check if user is blocked
    if (user.isBlocked) {
      throw ApiError.forbidden("Your account has been suspended.");
    }

    // Attach user to request
    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restricts access to specific roles.
 * Must be used AFTER protect middleware.
 *
 * Usage: router.get("/admin", protect, restrictTo(UserRole.ADMIN), handler)
 */
export const restrictTo =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Not authenticated."));
    }

    if (!roles.includes(req.user.role as UserRole)) {
      return next(ApiError.forbidden("You do not have permission to perform this action."));
    }

    next();
  };
