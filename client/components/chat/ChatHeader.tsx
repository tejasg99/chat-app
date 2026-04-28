"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Users,
  UserPlus,
  LogOut,
  MoreVertical,
  Info,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { IChat, IUser } from "@/types";
import { useAuthStore } from "@/stores/authStore";
import { useOnlinePresence } from "@/hooks/useOnlinePresence";
import { useChatStore } from "@/stores/chatStore";
import api from "@/lib/axios";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AddMembersModal } from "@/components/modals/AddMembersModal";
import { ProfilePanel } from "@/components/user/ProfilePanel";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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
  const { chats, setChats, setActiveChat } = useChatStore();

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [profilePanelUserId, setProfilePanelUserId] = useState<string | null>(
    null,
  );
  const [leavingGroup, setLeavingGroup] = useState(false);

  const { name, avatar, otherMember } = getHeaderInfo(
    chat,
    currentUser?._id ?? "",
  );

  const isOnline = useOnlinePresence(
    chat.type === "direct" ? otherMember : null,
  );

  const isAdmin = currentUser ? chat.admins.includes(currentUser._id) : false;

  // ── Open profile panel ────────────────────────────────────────────────────
  function openProfile(userId: string) {
    setProfilePanelUserId(userId);
    setShowProfilePanel(true);
    // Close members sheet if open
    setShowMembersSheet(false);
  }

  // ── Leave group ───────────────────────────────────────────────────────────
  async function handleLeaveGroup() {
    if (!currentUser) return;
    setLeavingGroup(true);
    try {
      await api.delete(`/chats/${chat._id}/members/${currentUser._id}`);
      // Remove chat from store
      setChats(chats.filter((c) => c._id !== chat._id));
      setActiveChat(null);
      toast.success(`You left ${chat.name ?? "the group"}.`);
      router.push("/chats");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to leave group.";
      toast.error(message);
    } finally {
      setLeavingGroup(false);
    }
  }

  return (
    <>
      <header
        className="
          shrink-0 flex items-center gap-3
          px-4 py-3
          bg-surface-container-low
        "
      >
        {/* Back — mobile only */}
        <button
          onClick={() => router.push("/chats")}
          className="
            md:hidden w-8 h-8 rounded-full
            flex items-center justify-center
            hover:bg-surface-container
            text-muted-foreground hover:text-foreground
            transition-smooth shrink-0
          "
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Clickable avatar — opens profile / members sheet */}
        <button
          onClick={() => {
            if (chat.type === "direct" && otherMember) {
              openProfile(otherMember._id);
            } else {
              setShowMembersSheet(true);
            }
          }}
          className="shrink-0 rounded-full transition-smooth hover:opacity-80"
          aria-label="View profile"
        >
          <UserAvatar
            name={name}
            avatar={avatar}
            isOnline={chat.type === "direct" ? isOnline : false}
            size="md"
          />
        </button>

        {/* Name + subtitle */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => {
              if (chat.type === "direct" && otherMember) {
                openProfile(otherMember._id);
              } else {
                setShowMembersSheet(true);
              }
            }}
            className="text-left w-full"
          >
            <h2 className="font-heading text-sm font-bold text-foreground truncate hover:text-brand-primary transition-smooth">
              {name}
            </h2>
          </button>
          <p className="text-xs text-muted-foreground truncate">
            {chat.type === "group" ? (
              <button
                onClick={() => setShowMembersSheet(true)}
                className="flex items-center gap-1 hover:text-foreground transition-smooth"
              >
                <Users className="w-3 h-3" />
                {chat.members.length} members
              </button>
            ) : isOnline ? (
              <span className="text-green-500 font-medium">Online</span>
            ) : otherMember?.lastSeen ? (
              `Last seen ${format(
                new Date(otherMember.lastSeen),
                "MMM d, HH:mm",
              )}`
            ) : (
              "Offline"
            )}
          </p>
        </div>

        {/* More actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="
                w-8 h-8 rounded-full shrink-0
                flex items-center justify-center
                hover:bg-surface-container
                text-muted-foreground hover:text-foreground
                transition-smooth
              "
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="
              w-52
              bg-surface-container-lowest
              border-0 shadow-ambient
              rounded-xl
            "
          >
            {/* Direct chat actions */}
            {chat.type === "direct" && otherMember && (
              <>
                <DropdownMenuItem
                  onClick={() => openProfile(otherMember._id)}
                  className="
                    gap-2.5 px-3 py-2.5 rounded-lg
                    text-sm text-foreground
                    hover:bg-surface-container-low
                    cursor-pointer
                  "
                >
                  <Info className="w-4 h-4 text-muted-foreground" />
                  View profile
                </DropdownMenuItem>
              </>
            )}

            {/* Group chat actions */}
            {chat.type === "group" && (
              <>
                <DropdownMenuItem
                  onClick={() => setShowMembersSheet(true)}
                  className="
                    gap-2.5 px-3 py-2.5 rounded-lg
                    text-sm text-foreground
                    hover:bg-surface-container-low
                    cursor-pointer
                  "
                >
                  <Users className="w-4 h-4 text-muted-foreground" />
                  View members
                </DropdownMenuItem>

                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => setShowAddMembers(true)}
                    className="
                      gap-2.5 px-3 py-2.5 rounded-lg
                      text-sm text-foreground
                      hover:bg-surface-container-low
                      cursor-pointer
                    "
                  >
                    <UserPlus className="w-4 h-4 text-muted-foreground" />
                    Add members
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-surface-container-high mx-2" />

                <DropdownMenuItem
                  onClick={handleLeaveGroup}
                  disabled={leavingGroup}
                  className="
                    gap-2.5 px-3 py-2.5 rounded-lg
                    text-sm text-destructive
                    hover:bg-surface-container-low
                    cursor-pointer
                  "
                >
                  <LogOut className="w-4 h-4" />
                  {leavingGroup ? "Leaving…" : "Leave group"}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* ── Members sheet (group) ── */}
      {chat.type === "group" && (
        <Sheet open={showMembersSheet} onOpenChange={setShowMembersSheet}>
          <SheetContent
            side="right"
            className="
              w-80
              bg-surface-container-lowest
              border-0 shadow-ambient
              p-0
            "
          >
            <SheetHeader className="px-6 pt-6 pb-4">
              <SheetTitle className="font-heading text-base font-bold text-foreground">
                Members · {chat.members.length}
              </SheetTitle>
            </SheetHeader>

            <div className="overflow-y-auto px-3 pb-6">
              {chat.members.map((member) => {
                const memberIsAdmin = chat.admins.includes(member._id);
                const isSelf = member._id === currentUser?._id;

                return (
                  <button
                    key={member._id}
                    onClick={() => openProfile(member._id)}
                    className="
                      w-full flex items-center gap-3 px-3 py-2.5
                      rounded-xl hover:bg-surface-container-low
                      transition-smooth text-left
                    "
                  >
                    <UserAvatar
                      name={member.name}
                      avatar={member.avatar}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {member.name}
                        {isSelf && (
                          <span className="text-muted-foreground font-normal">
                            {" "}
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    {memberIsAdmin && (
                      <span
                        className="
                          text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0
                          bg-brand-primary text-on-primary
                        "
                      >
                        Admin
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* ── Profile panel ── */}
      {showProfilePanel && profilePanelUserId && (
        <Sheet open={showProfilePanel} onOpenChange={setShowProfilePanel}>
          <SheetContent
            side="right"
            className="
              w-80 p-0
              bg-surface-container-lowest
              border-0 shadow-ambient
            "
          >
            <ProfilePanel
              userId={profilePanelUserId}
              onClose={() => setShowProfilePanel(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* ── Add members modal ── */}
      {chat.type === "group" && isAdmin && (
        <AddMembersModal
          open={showAddMembers}
          onOpenChange={setShowAddMembers}
          chat={chat}
        />
      )}
    </>
  );
}
