"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Trash2, Reply, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

import { IMessage } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";
import { UserAvatar } from "@/components/user/UserAvatar";
import { ReplyPreview } from "./ReplyPreview";
import { ReactionPicker } from "./ReactionPicker";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";

interface MessageBubbleProps {
  message: IMessage;
  chatId: string;
  isGrouped: boolean; // same sender as previous message (within time window)
  onReply: (message: IMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
}

export function MessageBubble({
  message,
  chatId,
  isGrouped,
  onReply,
  onReact,
}: MessageBubbleProps) {
  const currentUser = useAuthStore((s) => s.user);
  const [showActions, setShowActions] = useState(false);

  const isOwn = message.sender._id === currentUser?._id;
  const isDeleted = message.isDeleted;
  const isSystem = message.type === "system";

  // ── System message ────────────────────────────────────────────────────────
  if (isSystem) {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-muted-foreground bg-surface-container px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  function handleDelete() {
    getSocket().emit("message:delete", { messageId: message._id, chatId });
  }

  // ── Reaction summary ──────────────────────────────────────────────────────
  const reactionSummary = message.reactions.reduce<
    { emoji: string; count: number; includedMe: boolean }[]
  >((acc, r) => {
    if (r.reactedBy.length === 0) return acc;
    acc.push({
      emoji: r.emoji,
      count: r.reactedBy.length,
      includedMe: currentUser ? r.reactedBy.includes(currentUser._id) : false,
    });
    return acc;
  }, []);

  return (
    <div
      className={cn(
        "flex gap-2.5 group",
        isOwn ? "flex-row-reverse" : "flex-row",
        isGrouped ? "mt-1" : "mt-4",
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar — only shown for first message in a group, other side */}
      {!isOwn && (
        <div className="w-8 shrink-0 self-end">
          {!isGrouped && (
            <UserAvatar
              name={message.sender.name}
              avatar={message.sender.avatar}
              size="sm"
            />
          )}
        </div>
      )}

      {/* Bubble + metadata */}
      <div
        className={cn(
          "flex flex-col max-w-[70%]",
          isOwn ? "items-end" : "items-start",
        )}
      >
        {/* Sender name — group chats, first in sequence */}
        {!isOwn && !isGrouped && (
          <span className="text-xs font-medium text-muted-foreground mb-1 ml-1">
            {message.sender.name}
          </span>
        )}

        {/* Reply banner — uses ReplyPreview, no close button here */}
        {message.replyTo && !isDeleted && (
          <div className="mb-1 max-w-full">
            <ReplyPreview
              senderName={message.replyTo.sender.name}
              content={message.replyTo.content}
              messageType={message.replyTo.type}
              isDeleted={message.replyTo.isDeleted}
            />
          </div>
        )}

        {/* Bubble row with action buttons */}
        <div
          className={cn(
            "flex items-end gap-2",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          {/* Action buttons visible on hover*/}
          <div
            className={cn(
              "flex items-center gap-1 mb-1 transition-smooth",
              showActions ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            {/* Reaction picker */}
            {!isDeleted && (
              <ReactionPicker
                onReact={(emoji) => onReact(message._id, emoji)}
                side="top"
                align={isOwn ? "end" : "start"}
              />
            )}

            {/* Reply button */}
            {!isDeleted && (
              <button
                onClick={() => onReply(message)}
                className="
                  w-7 h-7 rounded-full
                  bg-surface-container-low
                  hover:bg-surface-container
                  flex items-center justify-center
                  transition-smooth text-muted-foreground
                "
                aria-label="Reply"
              >
                <Reply className="w-3.5 h-3.5" />
              </button>
            )}

            {/* More actions (own messages only) */}
            {isOwn && !isDeleted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="
                      w-7 h-7 rounded-full
                      bg-surface-container-low
                      hover:bg-surface-container
                      flex items-center justify-center
                      transition-smooth text-muted-foreground
                    "
                    aria-label="More"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="
                    bg-surface-container-lowest
                    border-0 shadow-ambient
                    rounded-xl
                  "
                >
                  <DropdownMenuItem
                    onClick={handleDelete}
                    className="
                      gap-2 px-3 py-2.5 rounded-lg
                      text-sm text-destructive
                      hover:bg-surface-container-low
                      cursor-pointer
                    "
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete message
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* The bubble itself */}
          <div
            className={cn(
              "px-4 py-2.5 rounded-[20px] wrap-break-word",
              isDeleted
                ? "bg-surface-container italic text-muted-foreground text-sm"
                : isOwn
                  ? "bg-brand-primary text-on-primary"
                  : "bg-surface-container-high text-on-surface",
            )}
          >
            {isDeleted ? (
              <span>This message was deleted</span>
            ) : message.type === "image" ? (
              <Image
                src={message.content}
                alt="Shared image"
                className="max-w-full max-h-72 rounded-xl object-cover"
                loading="lazy"
              />
            ) : (
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        </div>

        {/* Reactions row */}
        {reactionSummary.length > 0 && (
          <div
            className={cn(
              "flex flex-wrap gap-1 mt-1",
              isOwn ? "justify-end mr-1" : "justify-start ml-1",
            )}
          >
            {reactionSummary.map(({ emoji, count, includedMe }) => (
              <button
                key={emoji}
                onClick={() => onReact(message._id, emoji)}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-smooth",
                  includedMe
                    ? "bg-brand-primary-container text-on-primary"
                    : "bg-surface-container hover:bg-surface-container-high text-on-surface",
                )}
              >
                <span>{emoji}</span>
                <span className="font-medium">{count}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp  */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            isOwn ? "flex-row-reverse" : "flex-row",
          )}
        >
          <span className="text-[10px] text-muted-foreground">
            {format(new Date(message.createdAt), "HH:mm")}
          </span>
        </div>
      </div>
    </div>
  );
}
