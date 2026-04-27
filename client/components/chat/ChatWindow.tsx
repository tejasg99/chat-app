"use client";

import { useState, useEffect } from "react";

import { IChat, IMessage } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";
import { useReactions } from "@/hooks/useReactions";
import api from "@/lib/axios";

import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";

interface ChatWindowProps {
  chat: IChat;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { handleReact } = useReactions(chat._id);
  const [replyTo, setReplyTo] = useState<IMessage | null>(null);

  // Map of userId → name for currently typing users
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );

  // ── Join socket room + initial read receipt ───────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.emit("chat:join", chat._id);
    socket.emit("message:read", { chatId: chat._id });

    api.patch(`/chats/${chat._id}/messages/read`).catch(() => {
      /* silent */
    });

    return () => {
      socket.emit("chat:leave", chat._id);
    };
  }, [chat._id]);

  // ── Typing indicator listeners ────────────────────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    function onTypingStart({
      chatId,
      userId,
      name,
    }: {
      chatId: string;
      userId: string;
      name: string;
    }) {
      if (chatId !== chat._id || userId === currentUser?._id) return;
      setTypingUsers((prev) => new Map(prev).set(userId, name));
    }

    function onTypingStop({
      chatId,
      userId,
    }: {
      chatId: string;
      userId: string;
    }) {
      if (chatId !== chat._id) return;
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
    }

    socket.on("typing:start", onTypingStart);
    socket.on("typing:stop", onTypingStop);

    return () => {
      socket.off("typing:start", onTypingStart);
      socket.off("typing:stop", onTypingStop);
    };
  }, [chat._id, currentUser?._id]);

  // ── Mark as read on incoming messages (if tab is focused) ─────────────────
  useEffect(() => {
    const socket = getSocket();

    function onNewMessage(message: IMessage) {
      if (message.chat !== chat._id) return;
      if (document.hasFocus()) {
        socket.emit("message:read", { chatId: chat._id });
      }
    }

    socket.on("message:new", onNewMessage);
    return () => {
      socket.off("message:new", onNewMessage);
    };
  }, [chat._id]);

  const typingNames = Array.from(typingUsers.values());

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Header */}
      <ChatHeader chat={chat} />

      {/* Messages */}
      <MessageList
        chatId={chat._id}
        onReply={setReplyTo}
        onReact={handleReact}
      />

      {/* Typing indicator */}
      <TypingIndicator names={typingNames} />

      {/* Input */}
      <MessageInput
        chatId={chat._id}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
      />
    </div>
  );
}
