import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),
  avatar: z.url("Avatar must be a valid URL").optional(),
});

export const searchUsersSchema = z.object({
  q: z
    .string({ error: "Search query is required" })
    .trim()
    .min(2, "Search query must be at least 2 characters")
    .max(50, "Search query too long"),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
export type SearchUsersSchema = z.infer<typeof searchUsersSchema>;
