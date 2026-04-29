"use client";

import { MessageCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyChatsProps {
  onNewChat: () => void;
}

export function EmptyChats({ onNewChat }: EmptyChatsProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      {/* Icon */}
      <div
        className="
          w-20 h-20 rounded-3xl
          bg-surface-container
          flex items-center justify-center
          mb-6
        "
      >
        <MessageCircle className="w-9 h-9 text-muted-foreground opacity-50" />
      </div>

      {/* Copy */}
      <h2 className="font-heading text-xl font-bold text-foreground mb-2">
        No conversations yet
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed max-w-55 mb-8">
        Start a new chat or wait for someone to reach out.
      </p>

      {/* CTA */}
      <Button
        onClick={onNewChat}
        className="
          h-10 px-6 rounded-full
          bg-brand-primary hover:bg-brand-secondary-container
          text-on-primary text-sm font-medium
          transition-smooth
        "
      >
        <Plus className="w-4 h-4 mr-1.5" />
        Start a conversation
      </Button>
    </div>
  );
}
