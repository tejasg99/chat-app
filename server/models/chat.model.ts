import mongoose, { Schema } from "mongoose";
import type { IChat } from "../types/index.ts";

const chatSchema = new Schema<IChat>(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: [true, "Chat type is required"],
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, "Group name cannot exceed 100 characters"],
      // Required only for group chats — enforced at service layer
    },
    avatar: {
      type: String,
      default: "",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Quickly find all chats for a user
chatSchema.index({ members: 1 });
// Prevent duplicate direct chats between same two users
chatSchema.index({ type: 1, members: 1 });
chatSchema.index({ updatedAt: -1 });

export const Chat = mongoose.model<IChat>("Chat", chatSchema);
