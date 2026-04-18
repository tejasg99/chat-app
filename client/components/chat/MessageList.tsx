"use client";

import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useMessageStore } from "@/stores/messageStore";
import { useMessages } from "@/hooks/useMessages";
import { IMessage } from "@/types";
import { MessageBubble } from "./MessageBubble";
import { InfiniteScrollTrigger } from "@/components/shared/InfiniteScrollTrigger";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  chatId: string;
  onReply: (message: IMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
}

// Messages within 5 minutes of each other from the same sender are "grouped"
const GROUP_THRESHOLD_MS = 5 * 60 * 1000;

function shouldGroup(
  current: IMessage,
  previous: IMessage | undefined,
): boolean {
  if (!previous) return false;
  if (current.sender._id !== previous.sender._id) return false;
  const diff =
    new Date(current.createdAt).getTime() -
    new Date(previous.createdAt).getTime();
  return diff < GROUP_THRESHOLD_MS;
}

export function MessageList({ chatId, onReply, onReact }: MessageListProps) {
  const messages = useMessageStore((s) => s.messages[chatId] ?? []);
  const { isLoading, isFetchingOlder, hasMore, loadOlder } =
    useMessages(chatId);

  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const isNearBottomRef = useRef(true);

  // ── Scroll to bottom on initial load ─────────────────────────────────────
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [isLoading]);

  // ── Auto-scroll on new messages (only if near bottom) ────────────────────
  useEffect(() => {
    if (isNearBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length]);

  // ── Save scroll height before prepending older messages ───────────────────
  const handleLoadOlder = useCallback(async () => {
    if (!listRef.current) return;
    // Save scroll height BEFORE prepend
    prevScrollHeightRef.current = listRef.current.scrollHeight;
    await loadOlder();
  }, [loadOlder]);

  // ── Restore scroll position after prepend ────────────────────────────────
  useEffect(() => {
    if (
      !isFetchingOlder &&
      prevScrollHeightRef.current > 0 &&
      listRef.current
    ) {
      const newScrollHeight = listRef.current.scrollHeight;
      const diff = newScrollHeight - prevScrollHeightRef.current;
      listRef.current.scrollTop += diff;
      prevScrollHeightRef.current = 0;
    }
  }, [isFetchingOlder, messages.length]);

  // ── Track if user is near bottom ─────────────────────────────────────────
  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 100;
  }, []);

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              i % 3 === 0 ? "flex-row-reverse" : "flex-row",
            )}
          >
            <Skeleton className="w-8 h-8 rounded-full shrink-0 bg-surface-container" />
            <Skeleton
              className={cn(
                "h-10 rounded-[20px] bg-surface-container",
                i % 3 === 0 ? "w-48" : "w-64",
              )}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Say hello! 👋
        </p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {/* Infinite scroll sentinel — sits at top */}
      {hasMore && (
        <InfiniteScrollTrigger
          onTrigger={handleLoadOlder}
          isLoading={isFetchingOlder}
          className="h-1"
        />
      )}

      {/* Older messages spinner */}
      {isFetchingOlder && (
        <div className="flex justify-center py-3">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Messages */}
      {messages.map((message, index) => {
        const previous = index > 0 ? messages[index - 1] : undefined;
        const grouped = shouldGroup(message, previous);

        return (
          <MessageBubble
            key={message._id}
            message={message}
            chatId={chatId}
            isGrouped={grouped}
            onReply={onReply}
            onReact={onReact}
          />
        );
      })}

      {/* Invisible bottom anchor */}
      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
