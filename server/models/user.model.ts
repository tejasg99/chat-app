import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcrypt";

// Enums
export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// Interfaces

/**
 * Represents a single device/session's refresh token entry.
 */
export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Core user shape — used everywhere in the app.
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string; // Optional — not present for OAuth users
  avatar?: string;
  bio?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;

  // ── Presence ──────────────────────────────
  isOnline: boolean;
  lastSeen: Date;

  // ── Account State ──────────────────────────
  isVerified: boolean;
  isBlocked: boolean;

  // ── Tokens ────────────────────────────────
  refreshTokens: IRefreshToken[];

  // ── Timestamps (auto by Mongoose) ─────────
  createdAt: Date;
  updatedAt: Date;

  // ── Instance Methods ───────────────────────
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Omit<IUser, "password" | "refreshTokens">;
}

/**
 * Static methods on the User Model.
 */
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Sub-schemas

const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  { _id: false }, // No need for a separate _id on sub-documents
);

// Main user schema
const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },

    avatar: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: [200, "Bio cannot exceed 200 characters"],
      default: null,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },

    authProvider: {
      type: String,
      enum: Object.values(AuthProvider),
      default: AuthProvider.LOCAL,
    },

    googleId: {
      type: String,
      default: null,
      sparse: true, // Allows multiple null values in unique index
    },

    // Presence
    isOnline: {
      type: Boolean,
      default: false,
    },

    lastSeen: {
      type: Date,
      default: Date.now,
    },

    // Account State
    isVerified: {
      type: Boolean,
      default: false,
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    // Tokens
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
      select: false, // Never returned in queries by default
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
    versionKey: false,
  },
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: -1 });

// Pre save hook
userSchema.pre("save", async function (next) {
  // Only hash if password field was modified
  if (!this.isModified("password") || !this.password) {
    return next();
  }

  try {
    const saltRounds = 12;
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance methods

/**
 * Compares a plain-text password against the stored hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Returns a user object safe to send to the client.
 * Strips password, refreshTokens, and other sensitive fields.
 */
userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.googleId;
  return userObject;
};

// Static methods

/**
 * Find a user by email, explicitly selecting the password field.
 * Used during login flow.
 */
userSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email: email.toLowerCase().trim() }).select("+password +refreshTokens");
};

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
