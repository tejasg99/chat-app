"use client";

import { ChatList } from "@/components/chat/ChatList";
import { NoChatSelected } from "@/components/empty-states/NoChatSelected";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";

export default function ChatsPage() {
  return (
    <div className="flex h-full w-full">
      <ErrorBoundary>
        <ChatList />
      </ErrorBoundary>

      <main className="flex-1 hidden md:flex">
        <NoChatSelected />
      </main>
    </div>
  );
}
