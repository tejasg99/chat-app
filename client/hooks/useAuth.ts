import { useAuthStore } from "@/stores/authStore";

/**
 * Thin convenience hook — components import from here,
 * not directly from the store, so we have one place to
 * add derived state (e.g. isAdmin) later.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const logout = useAuthStore((s) => s.logout);

  return { user, accessToken, isAuthenticated, setUser, setAccessToken, logout };
}