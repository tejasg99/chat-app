"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import api from "@/lib/axios";
import { useAuthStore } from "@/stores/authStore";
import { ApiResponse, IUser } from "@/types";
import { ImageUploadButton } from "@/components/shared/ImageUploadButton";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

// ─── Local schema (profile-specific) ─────────────────────────────────────────
const editProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be at most 50 characters")
    .trim(),
});

type EditProfileFormData = z.infer<typeof editProfileSchema>;

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileModal({
  open,
  onOpenChange,
}: EditProfileModalProps) {
  const { user, setUser } = useAuthStore();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    undefined,
  );

  const form = useForm<EditProfileFormData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: { name: "" },
  });

  const { isSubmitting } = form.formState;

  // ── Sync form to latest user state whenever modal opens ───────────────────
  useEffect(() => {
    if (open && user) {
      form.reset({ name: user.name });
      setAvatarPreview(user.avatar);
    }
  }, [open, user, form]);

  // ── Save name ─────────────────────────────────────────────────────────────
  async function onSubmit(values: EditProfileFormData) {
    if (values.name.trim() === user?.name) {
      onOpenChange(false);
      return;
    }
    try {
      const { data } = await api.patch<ApiResponse<IUser>>("/users/me", {
        name: values.name.trim(),
      });
      if (!data.data) throw new Error(data.message);
      setUser(data.data);
      toast.success("Profile updated!");
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to update profile.";
      toast.error(message);
    }
  }

  // ── Upload avatar ─────────────────────────────────────────────────────────
  async function handleAvatarSelect(file: File) {
    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Avatar must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    // Optimistic local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const { data } = await api.post<ApiResponse<IUser>>(
        "/users/me/avatar",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      if (!data.data) throw new Error(data.message);

      setUser(data.data);
      setAvatarPreview(data.data.avatar);
      toast.success("Avatar updated!");
    } catch (err: unknown) {
      // Revert preview on failure
      setAvatarPreview(user?.avatar);
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to upload avatar.";
      toast.error(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          sm:max-w-sm
          bg-surface-container-lowest
          border-0 shadow-ambient
          rounded-2xl p-0 overflow-hidden
        "
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="font-heading text-lg font-bold text-foreground">
            Edit profile
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pt-6 pb-6 space-y-6">
          {/* ── Avatar ── */}
          <div className="flex flex-col items-center gap-2">
            <ImageUploadButton
              onFileSelect={handleAvatarSelect}
              isUploading={isUploadingAvatar}
              previewUrl={avatarPreview}
              name={user?.name}
              size="lg"
            />
            <p className="text-xs text-muted-foreground">
              Click to change · Max 5MB
            </p>
          </div>

          {/* ── Name + email form ── */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="space-y-1.5">
                    <Label className="text-sm font-medium text-foreground">
                      Display name
                    </Label>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Your name"
                        className="
                          h-11 px-4
                          bg-surface-container-highest
                          border-0 rounded-xl
                          text-foreground
                          placeholder:text-muted-foreground
                          focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                          transition-smooth
                        "
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-destructive" />
                  </FormItem>
                )}
              />

              {/* Email — read-only */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Email address
                </Label>
                <div
                  className="
                    h-11 px-4 flex items-center
                    bg-surface-container rounded-xl
                    text-sm text-muted-foreground
                    select-none
                  "
                >
                  {user?.email}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="
                    flex-1 h-10 rounded-full
                    text-sm text-muted-foreground
                    hover:bg-surface-container-low
                    transition-smooth
                    "
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || isUploadingAvatar}
                  className="
                    flex-1 h-10 rounded-full
                    bg-brand-primary hover:bg-brand-secondary-container
                    text-on-primary text-sm font-medium
                    transition-smooth disabled:opacity-50
                  "
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      Saving…
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
