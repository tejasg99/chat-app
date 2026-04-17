"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollTriggerProps {
  onTrigger: () => void;
  isLoading: boolean;
  className?: string;
}

/**
 * An invisible sentinel element placed at the TOP of the message list.
 * When it enters the viewport (user scrolls up), it fires onTrigger.
 * Uses IntersectionObserver — no scroll event listeners needed.
 */
export function InfiniteScrollTrigger({
  onTrigger,
  isLoading,
  className,
}: InfiniteScrollTriggerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  // Keep a stable ref to the callback to avoid re-connecting the observer
  const onTriggerRef = useRef(onTrigger);

  useEffect(() => {
    onTriggerRef.current = onTrigger;
  }, [onTrigger]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onTriggerRef.current();
        }
      },
      {
        // Trigger when 100% of the sentinel is visible
        threshold: 1.0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [isLoading]);

  return <div ref={sentinelRef} className={className} aria-hidden="true" />;
}
