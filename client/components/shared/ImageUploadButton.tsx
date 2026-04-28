"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ImageUploadButtonProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
  previewUrl?: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-12 w-12",
  md: "h-20 w-20",
  lg: "h-28 w-28",
};

const textSizeClasses = {
  sm: "text-sm",
  md: "text-xl",
  lg: "text-3xl",
};

function getInitials(name?: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function ImageUploadButton({
  onFileSelect,
  isUploading = false,
  previewUrl,
  name,
  size = "md",
  className,
}: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleClick() {
    if (!isUploading) fileInputRef.current?.click();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    onFileSelect(file);
    // Reset so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className={cn("relative inline-flex", className)}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isUploading}
        className={cn(
          "relative rounded-full overflow-hidden group",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          sizeClasses[size],
        )}
        aria-label="Change photo"
      >
        <Avatar className="w-full h-full">
          <AvatarImage src={previewUrl} alt={name ?? "Profile"} />
          <AvatarFallback
            className={cn(
              "bg-surface-container-high text-on-surface-variant font-medium",
              textSizeClasses[size],
            )}
          >
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>

        {/* Hover / loading overlay */}
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "flex items-center justify-center",
            "bg-black/40 transition-smooth",
            isUploading ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-white animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-white" />
          )}
        </div>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
