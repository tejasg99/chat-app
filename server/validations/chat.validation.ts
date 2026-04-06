import { z } from "zod";

export const createDirectChatSchema = z.object({
  targetUserId: z
    .string({ error: "Target user ID is required" })
    .min(1, "Target user ID cannot be empty"),
});

export const createGroupChatSchema = z.object({
  name: z
    .string({ error: "Group name is required" })
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name cannot exceed 100 characters"),
  members: z
    .array(z.string().min(1))
    .min(2, "A group must have at least 2 other members")
    .max(49, "A group cannot exceed 50 members"),
  avatar: z.url("Avatar must be a valid URL").optional(),
});

export const sendMessageSchema = z.object({
  content: z
    .string({ error: "Message content is required" })
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
  type: z.enum(["text", "image", "system"]).default("text"),
  replyTo: z.string().optional(),
});

// ─── Cursor-based pagination schema ───────────────────────────────────────────
// cursor = the _id of the oldest message the client currently has
// limit  = how many messages to fetch (default 30, max 50)
export const messagePaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});

// ─── Kept for report/admin endpoints that still use offset ────────────────────
export const offsetPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const reactionSchema = z.object({
  emoji: z
    .string({ error: "Emoji is required" })
    .min(1, "Emoji cannot be empty")
    .max(10, "Invalid emoji"),
});

export const createReportSchema = z.object({
  targetType: z.enum(["user", "message"], {
    error: "Target type is required",
  }),
  targetId: z.string({ error: "Target ID is required" }).min(1, "Target ID cannot be empty"),
  reason: z.enum(["spam", "harassment", "hate_speech", "inappropriate_content", "other"], {
    error: "Reason is required",
  }),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
});

export const updateReportStatusSchema = z.object({
  status: z.enum(["reviewed", "resolved", "dismissed"], {
    error: "Status is required",
  }),
});

export type CreateDirectChatSchema = z.infer<typeof createDirectChatSchema>;
export type CreateGroupChatSchema = z.infer<typeof createGroupChatSchema>;
export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export type MessagePaginationSchema = z.infer<typeof messagePaginationSchema>;
export type OffsetPaginationSchema = z.infer<typeof offsetPaginationSchema>;
export type ReactionSchema = z.infer<typeof reactionSchema>;
export type CreateReportSchema = z.infer<typeof createReportSchema>;
export type UpdateReportStatusSchema = z.infer<typeof updateReportStatusSchema>;
