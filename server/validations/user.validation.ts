import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),
  avatar: z.string().url("Avatar must be a valid URL").optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;
