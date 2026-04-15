import { create } from "zustand";
import { IMessage } from "@/types";

interface MessageState {
  messages: Record<string, IMessage[]>;
  setMessages: (chatId: string, messages: IMessage[]) => void;
  appendMessage: (chatId: string, message: IMessage) => void;
  prependMessages: (chatId: string, messages: IMessage[]) => void;
  updateMessage: (chatId: string, updated: IMessage) => void;
  deleteMessage: (chatId: string, messageId: string) => void;
}

export const useMessageStore = create<MessageState>()((set) => ({
  messages: {},

  setMessages: (chatId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [chatId]: messages },
    })),

  appendMessage: (chatId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...(state.messages[chatId] ?? []), message],
      },
    })),

  prependMessages: (chatId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: [...messages, ...(state.messages[chatId] ?? [])],
      },
    })),

  updateMessage: (chatId, updated) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).map((msg) =>
          msg._id === updated._id ? updated : msg
        ),
      },
    })),

  deleteMessage: (chatId, messageId) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [chatId]: (state.messages[chatId] ?? []).map((msg) =>
          msg._id === messageId
            ? { ...msg, isDeleted: true, content: "" }
            : msg
        ),
      },
    })),
}));