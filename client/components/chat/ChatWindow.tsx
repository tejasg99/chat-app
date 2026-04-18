"use client";

import { useState, useEffect, useCallback } from "react";

import { IChat, IMessage } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import { getSocket } from "@/lib/socket";

import { ChatHeader } from "./ChatHeader";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { TypingIndicator } from "./TypingIndicator";
import api from "@/lib/axios";

interface ChatWindowProps {
  chat: IChat;
}

export function ChatWindow({ chat }: ChatWindowProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { updateMessage } = useMessageStore();
  const [replyTo, setReplyTo] = useState<IMessage | null>(null);

  // typing state: Map of userId → name
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(
    new Map(),
  );

  // ── Join socket room + mark as read on mount ──────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    socket.emit("chat:join", chat._id);
    socket.emit("message:read", { chatId: chat._id });

    // Also call REST mark-as-read
    api.patch(`/chats/${chat._id}/messages/read`).catch(() => {
      /* silent */
    });

    return () => {
      socket.emit("chat:leave", chat._id);
    };
  }, [chat._id]);

  // ── Typing indicators ─────────────────────────────────────────────────────
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

  // ── Mark messages as read when new ones arrive ────────────────────────────
  useEffect(() => {
    const socket = getSocket();

    function onNewMessage(message: IMessage) {
      if (message.chat !== chat._id) return;
      // Emit read receipt immediately if window is focused
      if (document.hasFocus()) {
        socket.emit("message:read", { chatId: chat._id });
      }
    }

    socket.on("message:new", onNewMessage);
    return () => {
      socket.off("message:new", onNewMessage);
    };
  }, [chat._id]);

  // ── Reaction handler (optimistic) ────────────────────────────────────────
  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      if (!currentUser) return;

      // Optimistic update
      const messages = useMessageStore.getState().messages[chat._id] ?? [];
      const msg = messages.find((m) => m._id === messageId);
      if (!msg) return;

      const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
      const alreadyReacted = existingReaction?.reactedBy.includes(
        currentUser._id,
      );

      const updatedReactions = alreadyReacted
        ? // Toggle off
          msg.reactions
            .map((r) =>
              r.emoji === emoji
                ? {
                    ...r,
                    reactedBy: r.reactedBy.filter(
                      (id) => id !== currentUser._id,
                    ),
                  }
                : r,
            )
            .filter((r) => r.reactedBy.length > 0)
        : // Toggle on
          existingReaction
          ? msg.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, reactedBy: [...r.reactedBy, currentUser._id] }
                : r,
            )
          : [...msg.reactions, { emoji, reactedBy: [currentUser._id] }];

      updateMessage(chat._id, { ...msg, reactions: updatedReactions });

      // Emit to server — will confirm via message:reaction event
      getSocket().emit("message:react", {
        messageId,
        chatId: chat._id,
        emoji,
      });
    },
    [chat._id, currentUser, updateMessage],
  );

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
