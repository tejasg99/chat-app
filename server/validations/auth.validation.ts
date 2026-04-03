import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string({ error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),
  email: z.email({ message: "Email is required" }).toLowerCase(),
  password: z
    .string({ error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
});

export const loginSchema = z.object({
  email: z.string({ error: "Email is required" }).email("Invalid email format"),
  password: z.string({ error: "Password is required" }).min(1, "Password is required"),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ error: "Refresh token is required" }).optional(),
});

export type SignupSchema = z.infer<typeof signupSchema>;
export type LoginSchema = z.infer<typeof loginSchema>;
