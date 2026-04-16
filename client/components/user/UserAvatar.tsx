import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  name: string;
  avatar?: string;
  isOnline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { avatar: "h-8 w-8", dot: "h-2 w-2", text: "text-xs" },
  md: { avatar: "h-10 w-10", dot: "h-2.5 w-2.5", text: "text-sm" },
  lg: { avatar: "h-12 w-12", dot: "h-3 w-3", text: "text-base" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function UserAvatar({
  name,
  avatar,
  isOnline = false,
  size = "md",
  className,
}: UserAvatarProps) {
  const { avatar: avatarSize, dot: dotSize, text: textSize } = sizeMap[size];

  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={cn(avatarSize)}>
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback
          className={cn(
            "bg-surface-container-high text-on-surface-variant font-medium",
            textSize,
          )}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      {/* Online presence dot */}
      {isOnline && (
        <span
          className={cn(
            "absolute bottom-0 right-0 block rounded-full",
            "bg-green-500 ring-2 ring-background",
            dotSize,
          )}
          aria-label="Online"
        />
      )}
    </div>
  );
}
