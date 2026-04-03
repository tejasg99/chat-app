import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import type { IUser } from "../types/index.ts";

const userSchema = new Schema<IUser>(
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
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },
    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    blockedUsers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Pre-save: hash password ──────────────────────────────────────────────────
userSchema.pre("save", async function () {
  // Only hash if password was modified
  if (!this.isModified("password") || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

export const User = mongoose.model<IUser>("User", userSchema);
