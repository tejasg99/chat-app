"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Users, MessageCircle, Search, Settings, Moon, Sun } from "lucide-react";
import { toast } from "sonner";

import api from "@/lib/axios";
import { disconnectSocket } from "@/lib/socket";
import { ApiResponse, IChat } from "@/types";
import { useChatStore } from "@/stores/chatStore";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { ChatListItem } from "./ChatListItem";
import { UserAvatar } from "@/components/user/UserAvatar";
import { NewDirectChatModal } from "@/components/modals/NewDirectChatModal";
import { NewGroupChatModal } from "@/components/modals/NewGroupChatModal";
import { EditProfileModal } from "@/components/user/EditProfileModal";
import { ChatListSkeleton } from "@/components/skeletons/ChatListSkeleton";
import { EmptyChats } from "@/components/empty-states/EmptyChats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ChatList() {
  const { user, logout } = useAuth();
  const { chats, setChats } = useChatStore();
  const { isDark, toggleTheme } = useTheme();
  const [search, setSearch] = useState("");
  const [showDirectModal, setShowDirectModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // ── Fetch all chats on mount ──────────────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<IChat[]>>("/chats");
      if (!data.data) throw new Error(data.message);
      return data.data;
    },
  });

  // success handler
  useEffect(() => {
    if (data) {
      setChats(data);
    }
  }, [data, setChats]);

  // error handler
  useEffect(() => {
    if (error) {
      toast.error("Failed to load chats.");
    }
  }, [error]);

  // ── Filter by search ──────────────────────────────────────────────────────
  const filtered = chats.filter((chat) => {
    const term = search.toLowerCase();
    if (!term) return true;
    if (chat.type === "group") {
      return chat.name?.toLowerCase().includes(term);
    }
    const other = chat.members.find((m) => m._id !== user?._id);
    return other?.name.toLowerCase().includes(term);
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore
    } finally {
      // Explicitly close the socket before hard-navigating away so the server
      // receives the disconnect event and can clean up presence state.
      disconnectSocket();
      logout();
      window.location.href = "/login";
    }
  }

  // ── Render list body ──────────────────────────────────────────────────────
  function renderListBody() {
    if (isLoading) {
      return <ChatListSkeleton count={7} />;
    }

    // No chats at all (not a search result — actual empty state)
    if (chats.length === 0 && !search) {
      return <EmptyChats onNewChat={() => setShowDirectModal(true)} />;
    }

    // Search returned nothing
    if (filtered.length === 0 && search) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center mb-3">
            <Search className="w-5 h-5 text-muted-foreground opacity-50" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            No results for &ldquo;{search}&rdquo;
          </p>
          <p className="text-xs text-muted-foreground">
            Try a different name or keyword
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-0.5">
        {filtered.map((chat) => (
          <ChatListItem key={chat._id} chat={chat} />
        ))}
      </div>
    );
  }

  return (
    <>
      <aside
        className="
          flex flex-col h-full
          w-[320px] shrink-0
          bg-surface-container-low
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center">
              <MessageCircle className="w-3.5 h-3.5 text-on-primary" />
            </div>
            <span className="font-heading text-base font-bold text-foreground">
              ChatApp
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="
                  h-8 w-8 rounded-full
                  bg-brand-primary hover:bg-brand-secondary-container
                  text-on-primary transition-smooth
                "
                aria-label="New chat"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="
                w-48
                bg-surface-container-lowest
                border-0 shadow-ambient rounded-xl
              "
            >
              <DropdownMenuItem
                onClick={() => setShowDirectModal(true)}
                className="
                  gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground
                  hover:bg-surface-container-low cursor-pointer
                "
              >
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                New direct chat
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setShowGroupModal(true)}
                className="
                  gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground
                  hover:bg-surface-container-low cursor-pointer
                "
              >
                <Users className="w-4 h-4 text-muted-foreground" />
                New group chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Search */}
        <div className="px-4 pb-3 shrink-0">
          <div className="relative">
            <Search
              className="
              absolute left-3 top-1/2 -translate-y-1/2
              w-3.5 h-3.5 text-muted-foreground pointer-events-none
            "
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              className="
                h-9 pl-9 pr-4
                bg-surface-container border-0 rounded-xl
                text-sm text-foreground
                placeholder:text-muted-foreground
                focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0
                transition-smooth
              "
            />
          </div>
        </div>

        {/* List body */}
        <div className="flex-1 overflow-y-auto pb-4 px-2">
          {renderListBody()}
        </div>

        {/* User footer */}
        <div className="px-4 py-4 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="
                  w-full flex items-center gap-3 px-3 py-2.5
                  rounded-xl hover:bg-surface-container
                  transition-smooth text-left
                "
              >
                {user && (
                  <>
                    <UserAvatar
                      name={user.name}
                      avatar={user.avatar}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="
                w-52 mb-1
                bg-surface-container-lowest
                border-0 shadow-ambient rounded-xl
              "
            >
              <DropdownMenuItem
                onClick={() => setShowEditProfile(true)}
                className="
                  gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground
                  hover:bg-surface-container-low cursor-pointer
                "
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Edit profile
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={toggleTheme}
                className="
                  gap-2.5 px-3 py-2.5 rounded-lg text-sm text-foreground
                  hover:bg-surface-container-low cursor-pointer
                "
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Moon className="w-4 h-4 text-muted-foreground" />
                )}
                {isDark ? "Light mode" : "Dark mode"}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-surface-container-high mx-2" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="
                  px-3 py-2.5 rounded-lg text-sm text-destructive
                  hover:bg-surface-container-low cursor-pointer
                "
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      <NewDirectChatModal
        open={showDirectModal}
        onOpenChange={setShowDirectModal}
      />
      <NewGroupChatModal
        open={showGroupModal}
        onOpenChange={setShowGroupModal}
      />
      <EditProfileModal
        open={showEditProfile}
        onOpenChange={setShowEditProfile}
      />
    </>
  );
}
