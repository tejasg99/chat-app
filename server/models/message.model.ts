import mongoose, { Schema } from "mongoose";
import type { IMessage, IReaction } from "../types/index.ts";

const reactionSchema = new Schema<IReaction>(
  {
    emoji: {
      type: String,
      required: true,
    },
    reactedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { _id: false }, // No separate _id for subdocuments
);

const messageSchema = new Schema<IMessage>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: [true, "Chat reference is required"],
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },
    content: {
      type: String,
      required: [true, "Message content is required"],
      trim: true,
      maxlength: [5000, "Message cannot exceed 5000 characters"],
    },
    type: {
      type: String,
      enum: ["text", "image", "system"],
      default: "text",
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
    reactions: {
      type: [reactionSchema],
      default: [],
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Primary access pattern: get all messages for a chat, sorted by time
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
