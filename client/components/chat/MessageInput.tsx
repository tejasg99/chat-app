"use client";

import { useState, useRef, useCallback } from "react";
import { Send, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { IMessage } from "@/types";
import { getSocket } from "@/lib/socket";
import { useTyping } from "@/hooks/useTyping";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReplyPreview } from "./ReplyPreview";

interface MessageInputProps {
  chatId: string;
  replyTo: IMessage | null;
  onClearReply: () => void;
}

export function MessageInput({
  chatId,
  replyTo,
  onClearReply,
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { onTypingInput, stopTyping } = useTyping(chatId);

  // ── Send text message ─────────────────────────────────────────────────────
  const sendMessage = useCallback(() => {
    const trimmed = content.trim();
    if (!trimmed) return;

    getSocket().emit("message:send", {
      chatId,
      content: trimmed,
      type: "text",
      ...(replyTo ? { replyTo: replyTo._id } : {}),
    });

    setContent("");
    onClearReply();
    stopTyping();

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [content, chatId, replyTo, onClearReply, stopTyping]);

  // ── Enter to send, Shift+Enter for newline ────────────────────────────────
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    onTypingInput();
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  // ── Image upload ──────────────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    const MAX_SIZE_MB = 5;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB.`);
      return;
    }

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      await api.post(`/chats/${chatId}/messages/image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Backend broadcasts via socket — no manual append needed
    } catch {
      toast.error("Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="shrink-0 px-4 pb-4 pt-2">
      {/* Reply preview — uses ReplyPreview with onClose */}
      {replyTo && (
        <div className="mb-2">
          <ReplyPreview
            senderName={replyTo.sender.name}
            content={replyTo.content}
            messageType={replyTo.type}
            isDeleted={replyTo.isDeleted}
            onClose={onClearReply}
          />
        </div>
      )}

      {/* Input row */}
      <div
        className="
          flex items-end gap-2
          bg-surface-container
          rounded-2xl px-3 py-2
        "
      >
        {/* Image upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploadingImage}
          className="
            w-8 h-8 rounded-full shrink-0 mb-0.5
            flex items-center justify-center
            text-muted-foreground
            hover:text-foreground hover:bg-surface-container-high
            transition-smooth disabled:opacity-50
          "
          aria-label="Upload image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="
            flex-1 resize-none border-0 bg-transparent p-0
            text-sm text-foreground placeholder:text-muted-foreground
            focus-visible:ring-0 focus-visible:ring-offset-0
            min-h-8 max-h-40
            leading-relaxed py-1.5
          "
        />

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={sendMessage}
          disabled={!content.trim() || isUploadingImage}
          className="
            w-8 h-8 rounded-full shrink-0 mb-0.5
            bg-brand-primary hover:bg-brand-secondary-container
            text-on-primary transition-smooth
            disabled:opacity-40
          "
          aria-label="Send message"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground text-center mt-1.5">
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}
