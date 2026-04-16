"use client";

import { MessageCircle } from "lucide-react";
import { ChatList } from "@/components/chat/ChatList";

export default function ChatsPage() {
  return (
    <div className="flex h-full w-full">
      {/* Sidebar */}
      <ChatList />

      {/* Empty state — no chat selected */}
      <main className="flex-1 flex flex-col items-center justify-center bg-surface">
        <div
          className="
            flex flex-col items-center gap-4 text-center
            max-w-xs
          "
        >
          <div
            className="
              w-20 h-20 rounded-3xl
              bg-surface-container-low
              flex items-center justify-center
              mb-2
            "
          >
            <MessageCircle className="w-9 h-9 text-muted-foreground opacity-50" />
          </div>
          <h2 className="font-heading text-xl font-bold text-foreground">
            Your conversations
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Select a chat from the sidebar to get started, or start a new
            conversation.
          </p>
        </div>
      </main>
    </div>
  );
}