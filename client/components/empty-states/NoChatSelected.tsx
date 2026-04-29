import { MessageCircle } from "lucide-react";

export function NoChatSelected() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-surface">
      <div
        className="
          w-20 h-20 rounded-3xl
          bg-surface-container-low
          flex items-center justify-center
          mb-5
        "
      >
        <MessageCircle className="w-9 h-9 text-muted-foreground opacity-40" />
      </div>
      <h2 className="font-heading text-xl font-bold text-foreground mb-2">
        Your conversations
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed text-center max-w-55">
        Pick a chat from the sidebar or start a new one to begin.
      </p>
    </div>
  );
}
