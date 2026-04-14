import { create } from "zustand";

interface TypingUser {
  userId: string;
  name: string;
}

interface PresenceState {
  // Set of online user IDs
  onlineUsers: Set<string>;
  // Map of chatId → typing users
  typingUsers: Record<string, TypingUser[]>;

  // Actions
  setOnline: (userId: string) => void;
  setOffline: (userId: string) => void;
  setInitialPresence: (userIds: string[]) => void;
  addTyping: (chatId: string, userId: string, name: string) => void;
  removeTyping: (chatId: string, userId: string) => void;
}

export const usePresenceStore = create<PresenceState>()((set) => ({
  onlineUsers: new Set(),
  typingUsers: {},

  setOnline: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),

  setOffline: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers);
      updated.delete(userId);
      return { onlineUsers: updated };
    }),

  setInitialPresence: (userIds) =>
    set({ onlineUsers: new Set(userIds) }),

  addTyping: (chatId, userId, name) =>
    set((state) => {
      const current = state.typingUsers[chatId] ?? [];
      // Avoid duplicates
      if (current.some((u) => u.userId === userId)) return state;
      return {
        typingUsers: {
          ...state.typingUsers,
          [chatId]: [...current, { userId, name }],
        },
      };
    }),

  removeTyping: (chatId, userId) =>
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [chatId]: (state.typingUsers[chatId] ?? []).filter(
          (u) => u.userId !== userId,
        ),
      },
    })),
}));
