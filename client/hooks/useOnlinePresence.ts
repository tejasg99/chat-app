"use client";

import { usePresenceStore } from "@/stores/presenceStore";
import { IUser } from "@/types";

/**
 * Given a user object (from chat.members), returns their live online status.
 * Prioritises the socket presence store; falls back to user.isOnline from the
 * backend snapshot populated on initial load.
 */
export function useOnlinePresence(user?: IUser | null): boolean {
  const isOnline = usePresenceStore((s) => s.isOnline);

  if (!user) return false;

  // Socket presence is the source of truth once connected
  return isOnline(user._id) || user.isOnline;
}
