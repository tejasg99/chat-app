"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useMessageStore } from "@/stores/messageStore";
import { getSocket } from "@/lib/socket";

/**
 * Extracted from ChatWindow — handles optimistic reaction toggle
 * and socket emit. Used in ChatWindow and passed down to MessageBubble.
 */
export function useReactions(chatId: string) {
  const currentUser = useAuthStore((s) => s.user);
  const { updateMessage } = useMessageStore();

  const handleReact = useCallback(
    (messageId: string, emoji: string) => {
      if (!currentUser) return;

      const messages = useMessageStore.getState().messages[chatId] ?? [];
      const msg = messages.find((m) => m._id === messageId);
      if (!msg) return;

      const existingReaction = msg.reactions.find((r) => r.emoji === emoji);
      const alreadyReacted = existingReaction?.reactedBy.includes(
        currentUser._id,
      );

      const updatedReactions = alreadyReacted
        ? // Toggle off — remove user from reactedBy, drop entry if empty
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
        : existingReaction
          ? // Toggle on existing emoji — add user to reactedBy
            msg.reactions.map((r) =>
              r.emoji === emoji
                ? { ...r, reactedBy: [...r.reactedBy, currentUser._id] }
                : r,
            )
          : // New emoji reaction
            [...msg.reactions, { emoji, reactedBy: [currentUser._id] }];

      // Optimistic update — socket message:reaction will confirm
      updateMessage(chatId, { ...msg, reactions: updatedReactions });

      getSocket().emit("message:react", { messageId, chatId, emoji });
    },
    [chatId, currentUser, updateMessage],
  );

  return { handleReact };
}
