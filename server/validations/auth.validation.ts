import { z } from "zod";

// Email
const emailField = z
  .string()
  .min(1, "Email is required")
  .email({ message: "Invalid email address" })
  .transform((val) => val.toLowerCase().trim());

// Password
const passwordField = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password cannot exceed 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

// Name
const nameField = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name cannot exceed 50 characters")
  .transform((val) => val.trim());

// Schemas
export const signupSchema = z.object({
  body: z.object({
    name: nameField,
    email: emailField,
    password: passwordField,
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: emailField,
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshTokenSchema = z.object({
  cookies: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});

// Types
export type SignupInput = z.infer<typeof signupSchema>["body"];
export type LoginInput = z.infer<typeof loginSchema>["body"];
