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

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export type CreateDirectChatSchema = z.infer<typeof createDirectChatSchema>;
export type CreateGroupChatSchema = z.infer<typeof createGroupChatSchema>;
export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export type PaginationSchema = z.infer<typeof paginationSchema>;
