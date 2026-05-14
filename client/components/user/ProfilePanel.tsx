"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  X,
  Shield,
  Flag,
  Clock,
  Mail,
  UserX,
  UserCheck,
} from "lucide-react";

import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { ApiResponse, IUser } from "@/types";
import { UserAvatar } from "./UserAvatar";
import { ReportModal } from "@/components/modals/ReportModal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ProfilePanelProps {
  userId: string;
  onClose: () => void;
}

export function ProfilePanel({ userId, onClose }: ProfilePanelProps) {
  const { user: currentUser, setUser } = useAuthStore();
  const queryClient = useQueryClient();
  const isOnline = usePresenceStore((s) => s.isOnline);
  const [showReport, setShowReport] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const isBlocked = currentUser?.blockedUsers?.includes(userId) ?? false;
  const isSelf = currentUser?._id === userId;

  // ── Fetch target user profile ─────────────────────────────────────────────
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<IUser>>(`/users/${userId}`);
      if (!data.data) throw new Error(data.message);
      return data.data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    if (error) {
      toast.error("Could not load profile.");
    }
  }, [error]);

  // ── Block / unblock ───────────────────────────────────────────────────────
  async function handleBlockToggle() {
    if (!currentUser) return;
    setBlockLoading(true);
    try {
      if (isBlocked) {
        // Unblock
        await api.delete(`/users/block/${userId}`);
        setUser({
          ...currentUser,
          blockedUsers: currentUser.blockedUsers.filter((id) => id !== userId),
        });
        toast.success(`Unblocked ${profile?.name ?? "user"}.`);
      } else {
        // Block
        await api.post(`/users/block/${userId}`);
        setUser({
          ...currentUser,
          blockedUsers: [...currentUser.blockedUsers, userId],
        });
        toast.success(`Blocked ${profile?.name ?? "user"}.`);
      }
      queryClient.invalidateQueries({ queryKey: ["user-profile", userId] });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Action failed.";
      toast.error(message);
    } finally {
      setBlockLoading(false);
    }
  }

  const online = profile ? isOnline(profile._id) || profile.isOnline : false;

  return (
    <>
      <div
        className="
          flex flex-col h-full w-80
          bg-surface-container-lowest
          shadow-ambient
        "
      >
        {/* ── Header bar ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 className="font-heading text-base font-bold text-foreground">
            Profile
          </h3>
          <button
            onClick={onClose}
            className="
              w-8 h-8 rounded-full
              hover:bg-surface-container-low
              flex items-center justify-center
              text-muted-foreground hover:text-foreground
              transition-smooth
            "
            aria-label="Close panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {isLoading ? (
            // ── Skeleton ──────────────────────────────────────────────────
            <div className="space-y-4 pt-4">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="w-20 h-20 rounded-full bg-surface-container" />
                <Skeleton className="w-32 h-4 bg-surface-container" />
                <Skeleton className="w-20 h-3 bg-surface-container" />
              </div>
              <div className="space-y-3 pt-4">
                {[1, 2].map((i) => (
                  <Skeleton
                    key={i}
                    className="w-full h-12 rounded-xl bg-surface-container"
                  />
                ))}
              </div>
            </div>
          ) : profile ? (
            <>
              {/* ── Avatar + name ── */}
              <div className="flex flex-col items-center text-center pt-4 pb-6">
                <div className="relative mb-4">
                  <UserAvatar
                    name={profile.name}
                    avatar={profile.avatar}
                    isOnline={!isSelf && online}
                    size="lg"
                  />
                </div>

                <h2 className="font-heading text-xl font-bold text-foreground mb-1">
                  {profile.name}
                  {isSelf && (
                    <span className="text-sm font-normal text-muted-foreground ml-1.5">
                      (you)
                    </span>
                  )}
                </h2>

                {/* Online status badge */}
                {!isSelf && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
                      online
                        ? "bg-green-500/10 text-green-600"
                        : "bg-surface-container text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        online ? "bg-green-500" : "bg-muted-foreground/50",
                      )}
                    />
                    {online ? "Online" : "Offline"}
                  </span>
                )}
              </div>

              {/* ── Info rows ── */}
              <div className="space-y-2">
                {/* Email */}
                <div
                  className="
                    flex items-center gap-3 px-4 py-3
                    bg-surface-container-low rounded-xl
                  "
                >
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      Email
                    </p>
                    <p className="text-sm text-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>

                {/* Last seen (only for others) */}
                {!isSelf && !online && profile.lastSeen && (
                  <div
                    className="
                      flex items-center gap-3 px-4 py-3
                      bg-surface-container-low rounded-xl
                    "
                  >
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                        Last seen
                      </p>
                      <p className="text-sm text-foreground">
                        {format(
                          new Date(profile.lastSeen),
                          "MMM d, yyyy · h:mm a",
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Member since */}
                <div
                  className="
                    flex items-center gap-3 px-4 py-3
                    bg-surface-container-low rounded-xl
                  "
                >
                  <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-0.5">
                      Member since
                    </p>
                    <p className="text-sm text-foreground">
                      {format(new Date(profile.createdAt), "MMMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Actions (other users only) ── */}
              {!isSelf && (
                <div className="space-y-2 mt-6">
                  {/* Block / Unblock */}
                  <Button
                    variant="ghost"
                    onClick={handleBlockToggle}
                    disabled={blockLoading}
                    className={cn(
                      "w-full h-11 rounded-xl justify-start gap-3 px-4",
                      "text-sm font-medium transition-smooth",
                      isBlocked
                        ? "text-foreground hover:bg-surface-container-low"
                        : "text-destructive hover:bg-destructive/5",
                    )}
                  >
                    {blockLoading ? (
                      <>
                        <Shield className="w-4 h-4 shrink-0 animate-pulse" />
                        {isBlocked ? "Unblocking…" : "Blocking…"}
                      </>
                    ) : isBlocked ? (
                      <>
                        <UserCheck className="w-4 h-4 shrink-0" />
                        Unblock {profile.name}
                      </>
                    ) : (
                      <>
                        <UserX className="w-4 h-4 shrink-0" />
                        Block {profile.name}
                      </>
                    )}
                  </Button>

                  {/* Report */}
                  <Button
                    variant="ghost"
                    onClick={() => setShowReport(true)}
                    className="
                      w-full h-11 rounded-xl justify-start gap-3 px-4
                      text-sm font-medium text-destructive
                      hover:bg-destructive/5 transition-smooth
                    "
                  >
                    <Flag className="w-4 h-4 shrink-0" />
                    Report {profile.name}
                  </Button>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* ── Report modal ── */}
      {profile && (
        <ReportModal
          open={showReport}
          onOpenChange={setShowReport}
          targetType="user"
          targetId={profile._id}
          targetLabel={profile.name}
        />
      )}
    </>
  );
}
