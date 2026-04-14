"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, MessageCircle } from "lucide-react";

import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { ApiResponse, IUser } from "@/types";

/*
 * Google OAuth landing page.
 *
 * Flow:
 *   1. Google redirects here after consent.
 *   2. Backend has already set the httpOnly refresh cookie
 *      AND returns the accessToken as a query param or via /users/me.
 *   3. We call GET /users/me — the interceptor will pick up the
 *      accessToken from the query param if present, OR the cookie
 *      already allows the backend to identify the user.
 *   4. Hydrate the store and navigate to /chats.
 *
 * The backend may also return the accessToken as ?token= in the redirect URL.
 * We handle both patterns here.
 */
export default function AuthSuccessPage() {
  const router = useRouter();
  const { setUser, setAccessToken } = useAuthStore();
  const didRun = useRef(false);

  useEffect(() => {
    // Strict-mode guard — only run once
    if (didRun.current) return;
    didRun.current = true;

    async function handleSuccess() {
      try {
        // Check if backend passed accessToken as query param
        const params = new URLSearchParams(window.location.search);
        const tokenFromQuery = params.get("token");
        if (tokenFromQuery) {
          setAccessToken(tokenFromQuery);
        }

        // Fetch the authenticated user
        const { data } = await api.get<ApiResponse<IUser>>("/users/me");
        if (!data.data) throw new Error("Failed to fetch user profile.");

        setUser(data.data);
        toast.success(`Welcome, ${data.data.name}!`);
        router.replace("/chats");
      } catch {
        toast.error("Google sign-in failed. Please try again.");
        router.replace("/login");
      }
    }

    handleSuccess();
  }, [router, setAccessToken, setUser]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
      {/* Brand mark */}
      <div className="w-12 h-12 rounded-xl bg-brand-primary flex items-center justify-center mb-2">
        <MessageCircle className="w-6 h-6 text-on-primary" />
      </div>

      {/* Loading state */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-brand-primary" />
        <span className="text-sm font-medium">Completing sign-in…</span>
      </div>
    </div>
  );
}
