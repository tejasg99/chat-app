import { z } from "zod";

// Schemas

export const updateProfileSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name cannot exceed 50 characters")
      .trim()
      .optional(),

    bio: z.string().max(200, "Bio cannot exceed 200 characters").trim().optional(),

    avatar: z.string().url("Avatar must be a valid URL").optional(),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z
      .string({ error: "User ID is required" })
      .regex(/^[a-f\d]{24}$/i, "Invalid user ID format"),
  }),
});

// Inferred Types

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>["body"];
