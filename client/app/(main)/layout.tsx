"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import api from "@/lib/axios";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useMessageStore } from "@/stores/messageStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { ApiResponse, IUser } from "@/types";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, accessToken, setUser, logout } = useAuthStore();
  const { updateLastMessage, moveToTop, addChat } = useChatStore();
  const { appendMessage, updateMessage, deleteMessage } = useMessageStore();
  const { setOnline, setOffline } = usePresenceStore();

  const socketInitialized = useRef(false);

  // ── Hydrate user on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (user) return; // already hydrated

    async function fetchMe() {
      try {
        const { data } = await api.get<ApiResponse<IUser>>("/users/me");
        if (!data.data) throw new Error("Unauthorized");
        setUser(data.data);
      } catch {
        logout();
        router.replace("/login");
      }
    }

    fetchMe();
  }, [user, setUser, logout, router]);

  // ── Socket: connect + register all global listeners ───────────────────────
  useEffect(() => {
    if (!accessToken || socketInitialized.current) return;
    socketInitialized.current = true;

    const socket = getSocket();

    if (!socket.connected) {
      socket.connect();
    }

    // ── Incoming message ──────────────────────────────────────────────────
    socket.on("message:new", (message) => {
      appendMessage(message.chat, message);
      updateLastMessage(message.chat, message);
      moveToTop(message.chat);
    });

    // ── Deleted message ───────────────────────────────────────────────────
    socket.on("message:deleted", ({ messageId, chatId }) => {
      deleteMessage(chatId, messageId);
    });

    // ── Reaction update ───────────────────────────────────────────────────
    socket.on("message:reaction", ({ messageId, chatId, reactions }) => {
      // We need to get the current message and patch its reactions
      const messages = useMessageStore.getState().messages[chatId] ?? [];
      const msg = messages.find((m) => m._id === messageId);
      if (msg) {
        updateMessage(chatId, { ...msg, reactions });
      }
    });

    // ── Read receipts ─────────────────────────────────────────────────────
    socket.on("message:read", ({ chatId, messageIds }) => {
      const messages = useMessageStore.getState().messages[chatId] ?? [];
      messageIds.forEach((msgId) => {
        const msg = messages.find((m) => m._id === msgId);
        if (msg) {
          updateMessage(chatId, {
            ...msg,
            readBy: Array.from(new Set([...msg.readBy])),
          });
        }
      });
    });

    // ── New chat (someone added you) ─────────────────────────────────────
    socket.on("chat:new", (chat) => {
      addChat(chat);
      socket.emit("chat:join", chat._id);
      toast.message(`New conversation: ${chat.name ?? "Direct message"}`);
    });

    // ── Presence ─────────────────────────────────────────────────────────
    socket.on("user:online", ({ userId }) => setOnline(userId));
    socket.on("user:offline", ({ userId }) => setOffline(userId));

    // ── Socket errors ─────────────────────────────────────────────────────
    socket.on("error", ({ message }) => {
      toast.error(`Socket error: ${message}`);
    });

    return () => {
      socket.off("message:new");
      socket.off("message:deleted");
      socket.off("message:reaction");
      socket.off("message:read");
      socket.off("chat:new");
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("error");
      disconnectSocket();
      socketInitialized.current = false;
    };
  }, [
    accessToken,
    appendMessage,
    updateMessage,
    deleteMessage,
    updateLastMessage,
    moveToTop,
    addChat,
    setOnline,
    setOffline,
  ]);

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {children}
    </div>
  );
}