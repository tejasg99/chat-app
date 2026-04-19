"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { MessageType } from "@/types";

interface ReplyPreviewProps {
  senderName: string;
  content: string;
  messageType: MessageType;
  isDeleted: boolean;
  /** When provided, shows a close button — used in MessageInput */
  onClose?: () => void;
  className?: string;
}

function getPreviewText(
  content: string,
  type: MessageType,
  isDeleted: boolean,
): string {
  if (isDeleted) return "Message deleted";
  if (type === "image") return "📷 Image";
  return content;
}

export function ReplyPreview({
  senderName,
  content,
  messageType,
  isDeleted,
  onClose,
  className,
}: ReplyPreviewProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-3 py-2",
        "bg-surface-container rounded-xl",
        "border-l-2 border-brand-primary",
        className,
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-brand-primary mb-0.5">
          {onClose ? `Replying to ${senderName}` : senderName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {getPreviewText(content, messageType, isDeleted)}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="
            w-5 h-5 rounded-full shrink-0 mt-0.5
            bg-surface-container-high
            hover:bg-surface-container-highest
            flex items-center justify-center
            transition-smooth
          "
          aria-label="Cancel reply"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
