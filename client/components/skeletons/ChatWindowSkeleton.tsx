import { Skeleton } from "@/components/ui/skeleton";
import { MessageListSkeleton } from "./MessageListSkeleton";

export function ChatWindowSkeleton() {
  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Header skeleton */}
      <div
        className="
          shrink-0 flex items-center gap-3
          px-4 py-3
          bg-surface-container-low
        "
      >
        <Skeleton className="w-10 h-10 rounded-full bg-surface-container shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-36 bg-surface-container rounded-full" />
          <Skeleton className="h-2.5 w-20 bg-surface-container rounded-full" />
        </div>
        <Skeleton className="w-8 h-8 rounded-full bg-surface-container shrink-0" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 overflow-hidden">
        <MessageListSkeleton count={9} />
      </div>

      {/* Input skeleton */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <Skeleton className="h-12 w-full rounded-2xl bg-surface-container" />
      </div>
    </div>
  );
}
