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
import { Skeleton } from "@/components/ui/skeleton";

export default function ChatPage() {
  const params = useParams();
  const chatId = params?.chatId as string;
  const { setActiveChat, activeChat } = useChatStore();

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

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex h-full w-full">
        <ChatList />
        <div className="flex-1 flex flex-col bg-surface">
          {/* Header skeleton */}
          <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-low shrink-0">
            <Skeleton className="w-10 h-10 rounded-full bg-surface-container" />
            <div className="space-y-2">
              <Skeleton className="w-32 h-3.5 bg-surface-container" />
              <Skeleton className="w-20 h-2.5 bg-surface-container" />
            </div>
          </div>
          {/* Body skeleton */}
          <div className="flex-1 px-4 py-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex gap-2.5 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
              >
                <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-surface-container" />
                <Skeleton
                  className={`h-10 rounded-[20px] bg-surface-container ${
                    i % 2 === 0 ? "w-64" : "w-48"
                  }`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Chat not found ────────────────────────────────────────────────────────
  if (error || !data) {
    return notFound();
  }

  return (
    <div className="flex h-full w-full">
      {/* Sidebar — hidden on mobile when chat is open */}
      <div className="hidden md:block">
        <ChatList />
      </div>

      {/* Chat window */}
      <main className="flex-1 min-w-0">
        <ChatWindow chat={data} />
      </main>
    </div>
  );
}
