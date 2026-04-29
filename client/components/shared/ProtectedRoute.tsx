"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Client-side auth guard — a second layer after middleware.
 * Redirects to /login if no accessToken is in the store.
 * Used inside (main)/layout.tsx as a belt-and-suspenders check
 * after the /users/me call resolves.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
    }
  }, [accessToken, router]);

  if (!isAuthenticated && !accessToken) {
    return null;
  }

  return <>{children}</>;
}
