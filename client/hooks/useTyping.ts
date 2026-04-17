"use client";

import { useRef, useCallback, useEffect } from "react";
import { getSocket } from "@/lib/socket";

const STOP_DELAY_MS = 2000;

interface UseTypingReturn {
  onTypingInput: () => void;
  stopTyping: () => void;
}

export function useTyping(chatId: string): UseTypingReturn {
  const isTypingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopTyping = useCallback(() => {
    if (!isTypingRef.current) return;
    isTypingRef.current = false;
    getSocket().emit("typing:stop", { chatId });
  }, [chatId]);

  const onTypingInput = useCallback(() => {
    // Emit start only if not already flagged
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      getSocket().emit("typing:start", { chatId });
    }

    // Reset the inactivity timer on every keystroke
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      stopTyping();
    }, STOP_DELAY_MS);
  }, [chatId, stopTyping]);

  // Cleanup on unmount or chatId change
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Emit stop if we navigated away while still typing
      if (isTypingRef.current) {
        isTypingRef.current = false;
        getSocket().emit("typing:stop", { chatId });
      }
    };
  }, [chatId]);

  return { onTypingInput, stopTyping };
}
