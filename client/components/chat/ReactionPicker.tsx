"use client";

import { useState } from "react";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ─── Emoji dataset ────────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    label: "Quick",
    icon: "⚡",
    emojis: ["👍", "❤️", "😂", "😮", "😢", "🔥", "👏", "🎉", "🙏", "💯"],
  },
  {
    label: "Smileys",
    icon: "😊",
    emojis: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊",
      "😇", "🥰", "😍", "🤩", "😘", "😋", "😛", "😜",
      "🤪", "🤑", "🤗", "🤭", "😐", "😑", "😶", "😏",
      "😒", "🙄", "😬", "😮", "😲", "😳", "🥺", "😦",
      "😧", "😨", "😰", "😢", "😭", "😱", "😖", "😣",
      "😞", "😓", "😩", "😫", "🥱", "😤", "😠", "😡",
    ],
  },
  {
    label: "Gestures",
    icon: "👋",
    emojis: [
      "👍", "👎", "👌", "✌️", "🤞", "🤟", "🤙", "👈",
      "👉", "👆", "👇", "☝️", "✋", "🤚", "🖐️", "🖖",
      "👋", "🤜", "🤛", "👊", "✊", "🤝", "🙌", "👐",
      "🙏", "✍️", "💪", "🦾", "💅", "🤳", "🫶", "🫱",
    ],
  },
  {
    label: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
      "💘", "💝", "💟", "♥️", "❤️‍🔥", "❤️‍🩹",
    ],
  },
  {
    label: "Fun",
    icon: "🎉",
    emojis: [
      "🎉", "🎊", "🎈", "🎁", "🏆", "🥇", "🎯", "🎮",
      "🔥", "⚡", "💥", "✨", "🌟", "⭐", "💫", "🌈",
      "🎵", "🎶", "🚀", "🛸", "🌍", "🌙", "☀️", "🌊",
      "👑", "💎", "🍕", "🍔", "🎂", "🍺", "🍾", "☕",
    ],
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  /** Custom trigger element — defaults to a smile icon button */
  trigger?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function ReactionPicker({
  onReact,
  trigger,
  side = "top",
  align = "start",
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  function handleSelect(emoji: string) {
    onReact(emoji);
    setOpen(false);
    // Reset to quick tab for next open
    setActiveCategory(0);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            className="
              w-7 h-7 rounded-full
              bg-surface-container-low
              hover:bg-surface-container
              flex items-center justify-center
              transition-smooth text-muted-foreground
            "
            aria-label="Add reaction"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        className="
          w-72 p-0
          bg-surface-container-lowest
          border-0 shadow-ambient
          rounded-2xl overflow-hidden
        "
        side={side}
        align={align}
        sideOffset={8}
        // Stop click from propagating to message row (which would trigger hover state)
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Category tabs ── */}
        <div className="flex items-center gap-0.5 px-2 pt-2.5 pb-1.5">
          {EMOJI_CATEGORIES.map((cat, idx) => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(idx)}
              title={cat.label}
              aria-label={cat.label}
              className={cn(
                "flex-1 h-8 rounded-xl text-sm transition-smooth",
                activeCategory === idx
                  ? "bg-surface-container text-foreground"
                  : "text-muted-foreground hover:bg-surface-container-low"
              )}
            >
              {cat.icon}
            </button>
          ))}
        </div>

        {/* ── Category label ── */}
        <p className="px-3 pb-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {EMOJI_CATEGORIES[activeCategory].label}
        </p>

        {/* ── Emoji grid ── */}
        <div className="h-44 overflow-y-auto px-2 pb-2">
          <div className="grid grid-cols-8 gap-0.5">
            {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="
                  w-8 h-8 rounded-xl text-lg
                  hover:bg-surface-container-low
                  flex items-center justify-center
                  transition-smooth
                "
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}