"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { cn } from "@/lib/utils";
import { IChat, IUser, IMessage } from "@/types";
import { UserAvatar } from "@/components/user/UserAvatar";
import { useAuthStore } from "@/stores/authStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { useMessageStore } from "@/stores/messageStore";
import { useChatStore } from "@/stores/chatStore";

interface ChatListItemProps {
  chat: IChat;
}

function getChatDisplayInfo(
  chat: IChat,
  currentUserId: string,
): { name: string; avatar?: string; otherMember?: IUser } {
  if (chat.type === "group") {
    return { name: chat.name ?? "Group Chat", avatar: chat.avatar };
  }
  const other = chat.members.find((m) => m._id !== currentUserId);
  return {
    name: other?.name ?? "Unknown",
    avatar: other?.avatar,
    otherMember: other,
  };
}

export function ChatListItem({ chat }: ChatListItemProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const activeChat = useChatStore((s) => s.activeChat);
  const setActiveChat = useChatStore((s) => s.setActiveChat);
  const isOnline = usePresenceStore((s) => s.isOnline);
  const messagesMap = useMessageStore((s) => s.messages);
  const messages = useMemo<IMessage[]>(
    () => messagesMap[chat._id] ?? [],
    [messagesMap, chat._id]
  );

  if (!currentUser) return null;

  const { name, avatar, otherMember } = getChatDisplayInfo(
    chat,
    currentUser._id,
  );

  // Derive online status for direct chats
  const online =
    chat.type === "direct" && otherMember
      ? // Prefer socket presence, fall back to user.isOnline from backend
        isOnline(otherMember._id) || otherMember.isOnline
      : false;

  // Unread count — messages where readBy doesn't include currentUser
  const unreadCount = messages.filter(
    (m) =>
      !m.readBy.includes(currentUser._id) && m.sender._id !== currentUser._id,
  ).length;

  // Last message preview
  const lastMsg = chat.lastMessage;
  const lastMsgPreview = lastMsg
    ? lastMsg.isDeleted
      ? "Message deleted"
      : lastMsg.type === "image"
        ? "📷 Image"
        : lastMsg.content
    : null;

  const lastMsgTime = lastMsg?.createdAt
    ? formatDistanceToNowStrict(new Date(lastMsg.createdAt), {
        addSuffix: false,
      })
    : null;

  const isActive = activeChat?._id === chat._id;

  function handleClick() {
    setActiveChat(chat);
    router.push(`/chats/${chat._id}`);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left",
        "transition-smooth",
        isActive
          ? "bg-surface-container-highest"
          : "hover:bg-surface-container-low",
      )}
    >
      {/* Avatar */}
      <UserAvatar name={name} avatar={avatar} isOnline={online} size="md" />

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          {/* Chat name */}
          <span
            className={cn(
              "text-sm font-medium truncate text-foreground",
              unreadCount > 0 && "font-semibold",
            )}
          >
            {name}
          </span>

          {/* Timestamp — intentionally right-aligned (design spec asymmetry) */}
          {lastMsgTime && (
            <span className="text-xs text-muted-foreground shrink-0">
              {lastMsgTime}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          {/* Last message preview */}
          <span
            className={cn(
              "text-xs truncate",
              unreadCount > 0
                ? "text-foreground font-medium"
                : "text-muted-foreground",
            )}
          >
            {lastMsgPreview ?? <span className="italic">No messages yet</span>}
          </span>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span
              className="
                shrink-0
                inline-flex items-center justify-center
                min-w-5 h-5
                px-1.5
                rounded-full
                bg-brand-secondary text-on-secondary
                text-[10px] font-bold
                leading-none
              "
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
