import mongoose, { Schema, Model, HydratedDocument, Types } from "mongoose";
import bcrypt from "bcrypt";

// ── Enums ─────────────────────────────────────────────

export enum AuthProvider {
  LOCAL = "local",
  GOOGLE = "google",
}

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

// ── Interfaces ────────────────────────────────────────

export interface IRefreshToken {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * Core user shape (NO Document extension)
 */
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  authProvider: AuthProvider;
  googleId?: string;

  // Presence
  isOnline: boolean;
  lastSeen: Date;

  // Account State
  isVerified: boolean;
  isBlocked: boolean;

  // Tokens
  refreshTokens: IRefreshToken[];

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  toSafeObject(): Omit<IUser, "password" | "refreshTokens" | "googleId">;
}

/**
 * Hydrated document type (modern way)
 */
export type UserDocument = HydratedDocument<IUser>;

/**
 * Static methods
 */
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<UserDocument | null>;
}

// ── Sub-schema ────────────────────────────────────────

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
  { _id: false },
);

// ── Main Schema ───────────────────────────────────────

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
      select: false,
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
      sparse: true,
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
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ── Indexes ───────────────────────────────────────────
userSchema.index({ isOnline: 1 });
userSchema.index({ createdAt: -1 });

// ── Pre-save Hook ─────────────────────────────────────

userSchema.pre("save", async function (this: UserDocument) {
  // Only hash if password field was modified
  if (!this.isModified("password") || !this.password) {
    return;
  }

  const saltRounds = 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

// ── Instance Methods ──────────────────────────────────

userSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function (this: UserDocument) {
  const { ...safeUser } = this.toObject();
  return safeUser;
};

// ── Static Methods ────────────────────────────────────

userSchema.statics.findByEmail = function (
  this: IUserModel,
  email: string,
): Promise<UserDocument | null> {
  return this.findOne({ email: email.toLowerCase().trim() }).select("+password +refreshTokens");
};

// ── Model Export ──────────────────────────────────────

const User = mongoose.model<IUser, IUserModel>("User", userSchema);

export default User;
