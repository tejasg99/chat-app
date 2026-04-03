import { Request } from "express";
import { Document, Types } from "mongoose";

// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = "user" | "admin";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  role: UserRole;
  isOnline: boolean;
  lastSeen: Date;
  googleId?: string;
  isBlocked: boolean;
  blockedUsers: Types.ObjectId[];
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Passport / Express namespace augmentation ────────────────────────────────
// This makes Express.User = IUser, so req.user is typed correctly everywhere
// without needing a separate AuthenticatedRequest interface
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends IUser {}
  }
}

// ─── JWT ─────────────────────────────────────────────────────────────────────

export interface JwtAccessPayload {
  userId: string;
  email: string;
}

export interface JwtRefreshPayload {
  userId: string;
}

// ─── Express ─────────────────────────────────────────────────────────────────

// AuthenticatedRequest no longer needs to redefine user —
// it now inherits the correct type from the namespace augmentation above
export interface AuthenticatedRequest extends Request {
  user?: IUser; // IUser now matches Express.User via the augmentation
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── User Update ─────────────────────────────────────────────────────────────

export interface UpdateProfileInput {
  name?: string;
  avatar?: string;
}
