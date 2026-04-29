import { Skeleton } from "@/components/ui/skeleton";

interface ChatListSkeletonProps {
  count?: number;
}

export function ChatListSkeleton({ count = 7 }: ChatListSkeletonProps) {
  return (
    <div className="flex flex-col gap-0.5 px-2 pt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-2xl">
          {/* Avatar */}
          <Skeleton className="h-10 w-10 rounded-full shrink-0 bg-surface-container" />

          {/* Text lines */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton
                className="h-3.5 bg-surface-container rounded-full"
                style={{ width: `${48 + (i % 3) * 20}%` }}
              />
              <Skeleton className="h-3 w-10 bg-surface-container rounded-full shrink-0" />
            </div>
            <Skeleton
              className="h-3 bg-surface-container rounded-full"
              style={{ width: `${60 + (i % 4) * 10}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
