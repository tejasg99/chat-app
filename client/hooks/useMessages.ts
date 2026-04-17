"use client";

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { useMessageStore } from "@/stores/messageStore";
import { ApiResponse, PaginatedMessages } from "@/types";

interface UseMessagesReturn {
  isLoading: boolean;
  isFetchingOlder: boolean;
  hasMore: boolean;
  loadOlder: () => Promise<void>;
}

export function useMessages(chatId: string): UseMessagesReturn {
  const { setMessages, prependMessages } = useMessageStore();
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);

  // ── Initial message load (no cursor) ─────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PaginatedMessages>>(
        `/chats/${chatId}/messages`,
      );
      if (!data.data) throw new Error(data.message);
      return data.data;
    },
    // Don't re-fetch when switching back to tab — socket keeps us up to date
    staleTime: Infinity,
  });

  // ── Hydrate store on success ──────────────────────────────────────────────
  useEffect(() => {
    if (!data) return;
    // Backend returns newest-first → reverse before storing so index 0 = oldest
    const ordered = [...data.messages].reverse();
    setMessages(chatId, ordered);
    setNextCursor(data.nextCursor);
    setHasMore(data.hasMore);
  }, [data, chatId, setMessages]);

  // ── Toast on error ────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error("Failed to load messages.");
    }
  }, [error]);

  // ── Load older messages (cursor pagination) ───────────────────────────────
  const loadOlder = useCallback(async () => {
    if (!hasMore || !nextCursor || isFetchingOlder) return;

    setIsFetchingOlder(true);
    try {
      const { data } = await api.get<ApiResponse<PaginatedMessages>>(
        `/chats/${chatId}/messages?cursor=${nextCursor}`,
      );
      if (!data.data) return;

      // Backend returns newest-first for the older page → reverse as well
      const ordered = [...data.data.messages].reverse();
      prependMessages(chatId, ordered);
      setNextCursor(data.data.nextCursor);
      setHasMore(data.data.hasMore);
    } catch {
      toast.error("Failed to load older messages.");
    } finally {
      setIsFetchingOlder(false);
    }
  }, [chatId, hasMore, nextCursor, isFetchingOlder, prependMessages]);

  return { isLoading, isFetchingOlder, hasMore, loadOlder };
}
