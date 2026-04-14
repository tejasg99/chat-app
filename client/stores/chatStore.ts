import { create } from "zustand";
import { IChat, IMessage } from "@/types";

interface ChatState {
  chats: IChat[];
  activeChat: IChat | null;

  // Actions
  setChats: (chats: IChat[]) => void;
  setActiveChat: (chat: IChat | null) => void;
  addChat: (chat: IChat) => void;
  updateLastMessage: (chatId: string, message: IMessage) => void;
  moveToTop: (chatId: string) => void;
  updateChatAvatar: (chatId: string, avatar: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  chats: [],
  activeChat: null,

  setChats: (chats) => set({ chats }),

  setActiveChat: (activeChat) => set({ activeChat }),

  addChat: (chat) =>
    set((state) => ({
      // Avoid duplicates
      chats: state.chats.some((c) => c._id === chat._id)
        ? state.chats
        : [chat, ...state.chats],
    })),

  updateLastMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, lastMessage: message } : chat,
      ),
      // Also update activeChat if it's the same chat
      activeChat:
        state.activeChat?._id === chatId
          ? { ...state.activeChat, lastMessage: message }
          : state.activeChat,
    })),

  moveToTop: (chatId) =>
    set((state) => {
      const idx = state.chats.findIndex((c) => c._id === chatId);
      if (idx <= 0) return state; // already at top or not found
      const reordered = [...state.chats];
      const [chat] = reordered.splice(idx, 1);
      return { chats: [chat, ...reordered] };
    }),

  updateChatAvatar: (chatId, avatar) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat._id === chatId ? { ...chat, avatar } : chat,
      ),
      activeChat:
        state.activeChat?._id === chatId
          ? { ...state.activeChat, avatar }
          : state.activeChat,
    })),
}));
