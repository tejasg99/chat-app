import { Sparkles } from "lucide-react";

interface EmptyMessagesProps {
  chatName: string;
}

export function EmptyMessages({ chatName }: EmptyMessagesProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center">
      <div
        className="
          w-16 h-16 rounded-2xl
          bg-surface-container
          flex items-center justify-center
          mb-4
        "
      >
        <Sparkles className="w-7 h-7 text-muted-foreground opacity-50" />
      </div>
      <h3 className="font-heading text-base font-bold text-foreground mb-1.5">
        Say hello to {chatName}
      </h3>
      <p className="text-sm text-muted-foreground max-w-50 leading-relaxed">
        This is the beginning of your conversation.
      </p>
    </div>
  );
}
