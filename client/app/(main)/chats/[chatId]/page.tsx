"use client";

import { useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import api from "@/lib/axios";
import { ApiResponse, IChat } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { ChatList } from "@/components/chat/ChatList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { ChatWindowSkeleton } from "@/components/skeletons/ChatWindowSkeleton";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { setActiveChat } = useChatStore();

  // ── Fetch chat info ───────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<IChat>>(`/chats/${chatId}`);
      if (!data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!chatId,
  });

  // ── Sync to store on success ──────────────────────────────────────────────
  useEffect(() => {
    if (data) {
      setActiveChat(data);
    }
  }, [data, setActiveChat]);

  // ── Clear active chat on unmount ──────────────────────────────────────────
  useEffect(() => {
    return () => {
      setActiveChat(null);
    };
  }, [chatId, setActiveChat]);

  // ── Error handling ────────────────────────────────────────────────────────
  useEffect(() => {
    if (error) {
      toast.error("Could not load this chat.");
    }
  }, [error]);

  if (error && !data) return notFound();

  return (
    <div className="flex h-full w-full">
      {/* Sidebar — hidden on mobile when chat open */}
      <div className="hidden md:block shrink-0">
        <ErrorBoundary>
          <ChatList />
        </ErrorBoundary>
      </div>

      {/* Chat area */}
      <main className="flex-1 min-w-0">
        <ErrorBoundary>
          {isLoading || !data ? (
            <ChatWindowSkeleton />
          ) : (
            <ChatWindow chat={data} />
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
