import mongoose, { Schema } from "mongoose";
import type { IReport } from "../types/index.ts";

const reportSchema = new Schema<IReport>(
  {
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter is required"],
    },
    targetType: {
      type: String,
      enum: ["user", "message"],
      required: [true, "Report target type is required"],
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: [true, "Target ID is required"],
      // refPath makes Mongoose dynamically resolve the ref based on targetType
      refPath: "targetType",
    },
    reason: {
      type: String,
      enum: ["spam", "harassment", "hate_speech", "inappropriate_content", "other"],
      required: [true, "Report reason is required"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ targetId: 1, targetType: 1 });

// ─── Prevent duplicate reports (same user reporting same target) ───────────────
reportSchema.index({ reportedBy: 1, targetId: 1, targetType: 1 }, { unique: true });

export const Report = mongoose.model<IReport>("Report", reportSchema);
