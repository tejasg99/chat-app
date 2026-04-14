// stores/authStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { IUser } from "@/types";

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  //Actions
  setUser: (user: IUser) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: true,
        }),

      setAccessToken: (token) =>
        set({
          accessToken: token,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: "auth-store",
      // Only persist the token, not the full user object
      // User is re-fetched on app load via GET /users/me
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);