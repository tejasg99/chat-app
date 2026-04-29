import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface MessageListSkeletonProps {
  count?: number;
}

// Deterministic "random-looking" widths so skeletons feel natural
const BUBBLE_WIDTHS = [
  "w-48",
  "w-64",
  "w-56",
  "w-40",
  "w-72",
  "w-52",
  "w-36",
  "w-60",
  "w-44",
  "w-68",
];

const SIDES = [
  false,
  false,
  true,
  false,
  true,
  true,
  false,
  false,
  true,
  false,
];

export function MessageListSkeleton({ count = 8 }: MessageListSkeletonProps) {
  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {Array.from({ length: count }).map((_, i) => {
        const isOwn = SIDES[i % SIDES.length];
        const width = BUBBLE_WIDTHS[i % BUBBLE_WIDTHS.length];
        const showAvatar = !isOwn && i % 3 === 0;

        return (
          <div
            key={i}
            className={cn(
              "flex gap-2.5",
              isOwn ? "flex-row-reverse" : "flex-row",
            )}
          >
            {/* Avatar placeholder — keeps alignment consistent */}
            <div className="w-8 shrink-0 self-end">
              {showAvatar && (
                <Skeleton className="h-8 w-8 rounded-full bg-surface-container" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                "flex flex-col gap-1",
                isOwn ? "items-end" : "items-start",
              )}
            >
              {/* Sender name line (non-own grouped) */}
              {showAvatar && (
                <Skeleton className="h-2.5 w-20 bg-surface-container rounded-full mb-0.5" />
              )}
              <Skeleton
                className={cn(
                  "h-10 rounded-[20px] bg-surface-container",
                  width,
                )}
              />
              {/* Timestamp */}
              <Skeleton className="h-2 w-8 bg-surface-container rounded-full" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
