import { create } from "zustand";
import { IMessage, IReaction } from "@/types";

interface MessageState {
  // Map of chatId → ordered messages array (oldest first, newest last)
  messages: Record<string, IMessage[]>;
  // Track which chats have a next cursor for pagination
  cursors: Record<string, string | null>;
  hasMore: Record<string, boolean>;

  // Actions
  setMessages: (chatId: string, messages: IMessage[], nextCursor: string | null, hasMore: boolean) => void;
  appendMessage: (chatId: string, message: IMessage) => void;
  prependMessages: (chatId: string, messages: IMessage[], nextCursor: string | null, hasMore: boolean) => void;
  updateMessageReactions: (chatId: string, messageId: string, reactions: IReaction[]) => void;
  markMessageDeleted: (chatId: string, messageId: string) => void;
  markMessagesRead: (chatId: string, messageIds: string[], userId: string) => void;
  clearChat: (chatId: string) => void;
}

export const useMessageStore = create<MessageState>()((set) => ({
  messages: {},
  cursors: {},
  hasMore: {},

  setMessages: (chatId, messages, nextCursor, hasMore) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
      cursors: { ...state.cursors, [chatId]: nextCursor },
      hasMore: { ...state.hasMore, [chatId]: hasMore },
    })),

  appendMessage: (chatId, message) =>
    set((state) => {
      const existing = state.messages[chatId] ?? [];
      // Avoid duplicates
      if (existing.some((m) => m._id === message._id)) return state;
      return {
        messages: { ...state.messages, [chatId]: [...existing, message] },
      };
    }),

  prependMessages: (chatId, messages, nextCursor, hasMore) =>
    set((state) => {
      const existing = state.messages[chatId] ?? [];
      // Filter out any duplicates (by _id)
      const existingIds = new Set(existing.map((m) => m._id));
      const fresh = messages.filter((m) => !existingIds.has(m._id));
      return {
        messages: { ...state.messages, [chatId]: [...fresh, ...existing] },
        cursors: { ...state.cursors, [chatId]: nextCursor },
        hasMore: { ...state.hasMore, [chatId]: hasMore },
      };
    }),

  updateMessageReactions: (chatId, messageId, reactions) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).map((m) =>
          m._id === messageId ? { ...m, reactions } : m,
        ),
      },
    })),

  markMessageDeleted: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).map((m) =>
          m._id === messageId ? { ...m, isDeleted: true, content: "" } : m,
        ),
      },
    })),

  markMessagesRead: (chatId, messageIds, userId) =>
    set((state) => {
      const messageIdSet = new Set(messageIds);
      return {
        messages: {
          ...state.messages,
          [chatId]: (state.messages[chatId] ?? []).map((m) =>
            messageIdSet.has(m._id) && !m.readBy.includes(userId)
              ? { ...m, readBy: [...m.readBy, userId] }
              : m,
          ),
        },
      };
    }),

  clearChat: (chatId) =>
    set((state) => {
      const { [chatId]: _, ...restMessages } = state.messages;
      const { [chatId]: __, ...restCursors } = state.cursors;
      const { [chatId]: ___, ...restHasMore } = state.hasMore;
      return { messages: restMessages, cursors: restCursors, hasMore: restHasMore };
    }),
}));
