"use client";

import { ArrowLeft, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

import { IChat, IUser } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { UserAvatar } from "@/components/user/UserAvatar";

interface ChatHeaderProps {
  chat: IChat;
}

function getHeaderInfo(
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

export function ChatHeader({ chat }: ChatHeaderProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);

  const { name, avatar, otherMember } = getHeaderInfo(
    chat,
    currentUser?._id ?? "",
  );

  const isOnline = useOnlinePresence(
    chat.type === "direct" ? otherMember : null,
  );

  const memberCount = chat.members.length;

  return (
    <header
      className="
        shrink-0
        flex items-center gap-3
        px-4 py-3
        bg-surface-container-low
      "
    >
      {/* Back button — visible on mobile */}
      <button
        onClick={() => router.push("/chats")}
        className="
          md:hidden w-8 h-8 rounded-full
          flex items-center justify-center
          hover:bg-surface-container
          text-muted-foreground hover:text-foreground
          transition-smooth shrink-0
        "
        aria-label="Back to chats"
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      {/* Avatar */}
      <UserAvatar
        name={name}
        avatar={avatar}
        isOnline={chat.type === "direct" ? isOnline : false}
        size="md"
      />

      {/* Name + status */}
      <div className="flex-1 min-w-0">
        <h2 className="font-heading text-sm font-bold text-foreground truncate">
          {name}
        </h2>
        <p className="text-xs text-muted-foreground truncate">
          {chat.type === "group" ? (
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {memberCount} members
            </span>
          ) : isOnline ? (
            <span className="text-green-500 font-medium">Online</span>
          ) : otherMember?.lastSeen ? (
            `Last seen ${format(new Date(otherMember.lastSeen), "MMM d, HH:mm")}`
          ) : (
            "Offline"
          )}
        </p>
      </div>
    </header>
  );
}
