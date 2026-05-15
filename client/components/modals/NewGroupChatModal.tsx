"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { Search, Loader2, X, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import api from "@/lib/axios";
import { ApiResponse, IChat, IUser } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { getSocket } from "@/lib/socket";
import { UserAvatar } from "@/components/user/UserAvatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface NewGroupChatModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewGroupChatModal({
  open,
  onOpenChange,
}: NewGroupChatModalProps) {
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.user);
  const { addChat, setActiveChat } = useChatStore();

  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [debouncedSearch] = useDebounce(search, 350);

  // ── Search users ──────────────────────────────────────────────────────────
  const { data: users = [], isFetching } = useQuery({
    queryKey: ["user-search-group", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const { data } = await api.get<ApiResponse<IUser[]>>(
        `/users/search?q=${encodeURIComponent(debouncedSearch)}`,
      );
      return data.data ?? [];
    },
    enabled: debouncedSearch.trim().length > 0,
  });

  const filteredUsers = users.filter(
    (u) =>
      u._id !== currentUser?._id &&
      !selectedUsers.some((s) => s._id === u._id) &&
      !currentUser?.blockedUsers?.includes(u._id),
  );

  function toggleUser(user: IUser) {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  }

  function removeSelected(userId: string) {
    setSelectedUsers((prev) => prev.filter((u) => u._id !== userId));
  }

  // ── Create group ──────────────────────────────────────────────────────────
  async function handleCreate() {
    if (!groupName.trim()) {
      toast.error("Please enter a group name.");
      return;
    }
    if (selectedUsers.length < 1) {
      toast.error("Add at least one member.");
      return;
    }

    setCreating(true);
    try {
      const { data } = await api.post<ApiResponse<IChat>>("/chats/group", {
        name: groupName.trim(),
        memberIds: selectedUsers.map((u) => u._id),
      });
      if (!data.data) throw new Error(data.message);

      const chat = data.data;
      addChat(chat);
      setActiveChat(chat);

      // Join socket room immediately after creation
      getSocket().emit("chat:join", chat._id);

      toast.success(`Group "${chat.name}" created!`);
      onOpenChange(false);
      resetForm();
      router.push(`/chats/${chat._id}`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to create group.";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    setGroupName("");
    setSearch("");
    setSelectedUsers([]);
  }

  function handleOpenChange(val: boolean) {
    if (!val) resetForm();
    onOpenChange(val);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="
          sm:max-w-md
          bg-surface-container-lowest
          border-0 shadow-ambient
          rounded-2xl p-0 overflow-hidden
        "
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg font-bold text-foreground">
            New group chat
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pt-4 space-y-4">
          {/* Group name */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Group name
            </Label>
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Project Team"
              className="
                h-11 px-4
                bg-surface-container
                border-0 rounded-xl
                text-sm text-foreground
                placeholder:text-muted-foreground
                focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                transition-smooth
              "
            />
          </div>

          {/* Selected members chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <div
                  key={u._id}
                  className="
                    flex items-center gap-1.5 pl-2 pr-1.5 py-1
                    bg-surface-container rounded-full
                  "
                >
                  <span className="text-xs font-medium text-foreground">
                    {u.name}
                  </span>
                  <button
                    onClick={() => removeSelected(u._id)}
                    className="
                      w-4 h-4 rounded-full
                      bg-surface-container-high
                      flex items-center justify-center
                      hover:bg-surface-container-highest
                      transition-smooth
                    "
                    aria-label={`Remove ${u.name}`}
                  >
                    <X className="w-2.5 h-2.5 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* User search */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-foreground">
              Add members
            </Label>
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name…"
                className="
                  h-11 pl-10 pr-4
                  bg-surface-container
                  border-0 rounded-xl
                  text-sm text-foreground
                  placeholder:text-muted-foreground
                  focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                  transition-smooth
                "
              />
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-52 overflow-y-auto px-3 mt-2">
          {debouncedSearch.trim() &&
          filteredUsers.length === 0 &&
          !isFetching ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No users found</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredUsers.map((u) => (
                <button
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="
                    w-full flex items-center gap-3 px-3 py-2.5
                    rounded-xl
                    hover:bg-surface-container-low
                    transition-smooth text-left
                  "
                >
                  <UserAvatar name={u.name} avatar={u.avatar} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {u.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {u.email}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {selectedUsers.length > 0
              ? `${selectedUsers.length} member${selectedUsers.length > 1 ? "s" : ""} selected`
              : "No members selected"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              className="
                h-9 px-4 rounded-full
                text-sm text-muted-foreground
                hover:bg-surface-container-low
                transition-smooth
              "
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={
                creating || !groupName.trim() || selectedUsers.length < 1
              }
              className="
                h-9 px-5 rounded-full
                bg-brand-primary hover:bg-brand-secondary-container
                text-on-primary text-sm font-medium
                transition-smooth
                disabled:opacity-50
              "
            >
              {creating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Creating…
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5 mr-1.5" />
                  Create group
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
