"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { toast } from "sonner";
import { Search, Loader2, UserPlus, X } from "lucide-react";

import api from "@/lib/axios";
import { ApiResponse, IChat, IUser } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { UserAvatar } from "@/components/user/UserAvatar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AddMembersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: IChat;
}

export function AddMembersModal({
  open,
  onOpenChange,
  chat,
}: AddMembersModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const { setActiveChat } = useChatStore();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [adding, setAdding] = useState(false);
  const [debouncedSearch] = useDebounce(search, 350);

  const existingMemberIds = new Set(chat.members.map((m) => m._id));

  // ── Search users ──────────────────────────────────────────────────────────
  const { data: searchResults = [], isFetching } = useQuery({
    queryKey: ["user-search-add-members", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch.trim()) return [];
      const { data } = await api.get<ApiResponse<IUser[]>>(
        `/users/search?q=${encodeURIComponent(debouncedSearch)}`,
      );
      return data.data ?? [];
    },
    enabled: debouncedSearch.trim().length > 0,
  });

  // Filter: no existing members, no self, no already-selected, no blocked
  const filteredResults = searchResults.filter(
    (u) =>
      !existingMemberIds.has(u._id) &&
      u._id !== currentUser?._id &&
      !selectedUsers.some((s) => s._id === u._id) &&
      !currentUser?.blockedUsers.includes(u._id),
  );

  function toggleUser(user: IUser) {
    setSelectedUsers((prev) =>
      prev.some((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user],
    );
  }

  // ── Add members API call ──────────────────────────────────────────────────
  async function handleAdd() {
    if (selectedUsers.length === 0) return;
    setAdding(true);
    try {
      const { data } = await api.post<ApiResponse<IChat>>(
        `/chats/${chat._id}/members`,
        { memberIds: selectedUsers.map((u) => u._id) },
      );
      if (!data.data) throw new Error(data.message);

      // Sync updated chat into store
      setActiveChat(data.data);

      // Invalidate so ChatPage re-fetches fresh member list
      queryClient.invalidateQueries({ queryKey: ["chat", chat._id] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });

      const names = selectedUsers.map((u) => u.name).join(", ");
      toast.success(`Added ${names} to ${chat.name ?? "the group"}.`);
      handleClose();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to add members.";
      toast.error(message);
    } finally {
      setAdding(false);
    }
  }

  function handleClose() {
    setSearch("");
    setSelectedUsers([]);
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) handleClose();
        else onOpenChange(true);
      }}
    >
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
            Add members
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {chat.members.length} current member
            {chat.members.length !== 1 ? "s" : ""} in{" "}
            {chat.name ?? "this group"}
          </p>
        </DialogHeader>

        <div className="px-6 pt-4 space-y-3">
          {/* Selected user chips */}
          {selectedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedUsers.map((u) => (
                <div
                  key={u._id}
                  className="
                    flex items-center gap-1.5 pl-2.5 pr-1.5 py-1
                    bg-surface-container rounded-full
                  "
                >
                  <span className="text-xs font-medium text-foreground">
                    {u.name}
                  </span>
                  <button
                    onClick={() => toggleUser(u)}
                    className="
                      w-4 h-4 rounded-full
                      bg-surface-container-high
                      hover:bg-surface-container-highest
                      flex items-center justify-center
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

          {/* Search input */}
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
              placeholder="Search users to add…"
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

        {/* ── Results ── */}
        <div className="max-h-60 overflow-y-auto px-3 mt-2">
          {!debouncedSearch.trim() ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Search className="w-7 h-7 text-muted-foreground mb-3 opacity-40" />
              <p className="text-sm text-muted-foreground">
                Search for people to add
              </p>
            </div>
          ) : filteredResults.length === 0 && !isFetching ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {searchResults.length > 0
                  ? "All matching users are already in this group"
                  : "No users found"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => toggleUser(u)}
                  className="
                    w-full flex items-center gap-3 px-3 py-2.5
                    rounded-xl hover:bg-surface-container-low
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

        {/* ── Footer ── */}
        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <span className="text-xs text-muted-foreground">
            {selectedUsers.length > 0
              ? `${selectedUsers.length} selected`
              : "No members selected"}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={handleClose}
              className="
                h-9 px-4 rounded-full text-sm text-muted-foreground
                hover:bg-surface-container-low transition-smooth
              "
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={adding || selectedUsers.length === 0}
              className="
                h-9 px-5 rounded-full
                bg-brand-primary hover:bg-brand-secondary-container
                text-on-primary text-sm font-medium
                transition-smooth disabled:opacity-50
              "
            >
              {adding ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Adding…
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                  Add
                  {selectedUsers.length > 0
                    ? ` ${selectedUsers.length}`
                    : ""}{" "}
                  member{selectedUsers.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
