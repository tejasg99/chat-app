import { z } from "zod";

// ─── Signup ──────────────────────────────────────────────────────────────────
// Matches backend: validations/auth.validation.ts

export const signupSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z
    .email("Invalid email format")
    .toLowerCase()
    .trim(),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
});

export type SignupFormData = z.infer<typeof signupSchema>;

// ─── Login ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.email("Invalid email format").toLowerCase().trim(),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// ─── Update Profile ──────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

// ─── New Group Chat ───────────────────────────────────────────────────────────

export const newGroupChatSchema = z.object({
  name: z
    .string({ error: "Group name is required" })
    .trim()
    .min(2, "Group name must be at least 2 characters")
    .max(50, "Group name cannot exceed 50 characters"),
  members: z.array(z.string()).min(1, "Select at least 1 member"),
});

export type NewGroupChatSchema = z.infer<typeof newGroupChatSchema>;

// ─── Report ──────────────────────────────────────────────────────────────────

export const reportSchema = z.object({
  reason: z.enum(["spam", "harassment", "hate_speech", "inappropriate_content", "other"]),
  description: z.string().max(500).optional(),
});

export type ReportSchema = z.infer<typeof reportSchema>;
