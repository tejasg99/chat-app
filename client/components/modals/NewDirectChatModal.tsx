"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { Search, Loader2, MessageCircle } from "lucide-react";

import api from "@/lib/axios";
import { ApiResponse, IChat, IUser } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";
import { UserAvatar } from "@/components/user/UserAvatar";
import { usePresenceStore } from "@/stores/presenceStore";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useChatStore as useChatStoreActions } from "@/stores/chatStore";

interface NewDirectChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewDirectChatModal({
  open,
  onOpenChange,
}: NewDirectChatModalProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { addChat, setActiveChat } = useChatStore();
  const isOnline = usePresenceStore((s) => s.isOnline);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState<string | null>(null);
  const [debouncedSearch] = useDebounce(search, 350);

  // ── Search users ──────────────────────────────────────────────────────────
  const { data: users = [], isFetching } = useQuery({
    queryKey: ["user-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const { data } = await api.get<ApiResponse<IUser[]>>(
        `/users/search?q=${encodeURIComponent(debouncedSearch)}`,
      );
      return data.data ?? [];
    },
    enabled: debouncedSearch.trim().length > 0,
  });

  // Filter out self and blocked users
  const filteredUsers = users.filter(
    (u) =>
      u._id !== currentUser?._id && !currentUser?.blockedUsers?.includes(u._id),
  );

  // ── Create or open direct chat ────────────────────────────────────────────
  const handleSelectUser = useCallback(
    async (targetUser: IUser) => {
      setCreating(targetUser._id);
      try {
        const { data } = await api.post<ApiResponse<IChat>>("/chats/direct", {
          targetUserId: targetUser._id,
        });
        if (!data.data) throw new Error(data.message);

        const chat = data.data;
        addChat(chat);
        setActiveChat(chat);

        // Join socket room immediately
        getSocket().emit("chat:join", chat._id);

        onOpenChange(false);
        setSearch("");
        router.push(`/chats/${chat._id}`);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ?? "Failed to create chat.";
        toast.error(message);
      } finally {
        setCreating(null);
      }
    },
    [addChat, setActiveChat, onOpenChange, router],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          bg-surface-container-lowest
          border-0 shadow-ambient
          rounded-2xl p-0
          overflow-hidden
        "
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg font-bold text-foreground">
            New direct message
          </DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="px-6 pt-4 pb-3">
          <div className="relative">
            {isFetching ? (
              <Loader2
                className="
                absolute left-3 top-1/2 -translate-y-1/2
                w-4 h-4 text-muted-foreground animate-spin
              "
              />
            ) : (
              <Search
                className="
                absolute left-3 top-1/2 -translate-y-1/2
                w-4 h-4 text-muted-foreground pointer-events-none
              "
              />
            )}
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="
                h-11 pl-10 pr-4
                bg-surface-container
                border-0
                rounded-xl
                text-sm text-foreground
                placeholder:text-muted-foreground
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                transition-smooth
              "
            />
          </div>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto px-3 pb-4">
          {!debouncedSearch.trim() ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Search className="w-8 h-8 text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                Type a name to search users
              </p>
            </div>
          ) : filteredUsers.length === 0 && !isFetching ? (
            <div className="flex flex-col items-center py-10 text-center">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleSelectUser(u)}
                  disabled={creating === u._id}
                  className="
                    w-full flex items-center gap-3 px-3 py-2.5
                    rounded-xl
                    hover:bg-surface-container-low
                    transition-smooth text-left
                    disabled:opacity-60
                  "
                >
                  <UserAvatar
                    name={u.name}
                    avatar={u.avatar}
                    isOnline={isOnline(u._id) || u.isOnline}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                  {creating === u._id && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
