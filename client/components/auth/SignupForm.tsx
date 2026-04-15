"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2, MessageCircle } from "lucide-react";
import { z } from "zod";

import { signupSchema } from "@/validations";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { ApiResponse, IUser, TokenPair } from "@/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// ─── Extended schema (client-side only) ───────────────────────────────────────
// confirmPassword is validated here but never sent to the API.
const signupFormSchema = signupSchema
  .extend({
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupFormSchema>;

export function SignupForm() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(values: SignupFormData) {
    try {

      // Strip confirmPassword — backend doesn't accept it
      const { confirmPassword: _, ...payload } = values;

      const { data } = await api.post<
        ApiResponse<{ user: IUser; tokens: TokenPair }>
      >("/auth/signup", values);

      if (!data.data) throw new Error(data.message);

      setAccessToken(data.data.tokens.accessToken);
      setUser(data.data.user);
      toast.success(`Account created! Welcome, ${data.data.user.name}!`);
      router.push("/chats");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Signup failed. Please try again.";
      toast.error(message);
    }
  }

  function handleGoogleLogin() {
    window.location.href = "http://localhost:5000/api/auth/google";
  }

  return (
    <div className="w-full max-w-md">
      {/* ── Brand mark ── */}
      <div className="flex items-center gap-3 mb-10">
        <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-on-primary" />
        </div>
        <span className="font-heading text-xl font-bold text-foreground">
          ChatApp
        </span>
      </div>

      {/* ── Heading ── */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-2">
          Create an account
        </h1>
        <p className="text-muted-foreground text-sm">
          Join and start chatting in seconds.
        </p>
      </div>

      {/* ── Form ── */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Name */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Full name
                </Label>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Jane Doe"
                    autoComplete="name"
                    className="
                      h-12 px-4
                      bg-surface-container-highest
                      border-0
                      rounded-xl
                      text-foreground
                      placeholder:text-muted-foreground
                      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                      transition-smooth
                    "
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="
                      h-12 px-4
                      bg-surface-container-highest
                      border-0
                      rounded-xl
                      text-foreground
                      placeholder:text-muted-foreground
                      focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                      transition-smooth
                    "
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      className="
                        h-12 px-4 pr-12
                        bg-surface-container-highest
                        border-0
                        rounded-xl
                        text-foreground
                        placeholder:text-muted-foreground
                        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                        transition-smooth
                      "
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="
                        absolute right-4 top-1/2 -translate-y-1/2
                        text-muted-foreground hover:text-foreground
                        transition-smooth
                      "
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Confirm Password */}
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Confirm password
                </Label>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      autoComplete="new-password"
                      className="
                        h-12 px-4 pr-12
                        bg-surface-container-highest
                        border-0
                        rounded-xl
                        text-foreground
                        placeholder:text-muted-foreground
                        focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                        transition-smooth
                      "
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((p) => !p)}
                      className="
                        absolute right-4 top-1/2 -translate-y-1/2
                        text-muted-foreground hover:text-foreground
                        transition-smooth
                      "
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-destructive" />
              </FormItem>
            )}
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full h-12 mt-2
              bg-brand-primary hover:bg-brand-secondary-container
              text-on-primary
              rounded-full
              font-medium
              transition-smooth
              focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </form>
      </Form>

      {/* ── Divider ── */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-surface-container-high" />
        <span className="text-xs text-muted-foreground font-medium">or</span>
        <div className="flex-1 h-px bg-surface-container-high" />
      </div>

      {/* ── Google OAuth ── */}
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="
          w-full h-12
          bg-surface-container-lowest
          border-0 border-ghost
          rounded-full
          text-foreground font-medium
          hover:bg-surface-container-low
          transition-smooth
          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
        "
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      {/* ── Footer ── */}
      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-brand-primary font-medium hover:underline underline-offset-4 transition-smooth"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
