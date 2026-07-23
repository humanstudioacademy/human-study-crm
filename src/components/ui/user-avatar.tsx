import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const PALETTE = [
  "oklch(0.62 0.19 293)", // violeta
  "oklch(0.7 0.16 200)", // teal
  "oklch(0.75 0.17 70)", // âmbar
  "oklch(0.65 0.2 20)", // rosa/vermelho
  "oklch(0.72 0.14 150)", // verde
  "oklch(0.68 0.18 250)", // azul
];

function hashName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return (first + last).toUpperCase();
}

export function UserAvatar({
  name,
  size = "default",
  className,
}: {
  name: string;
  size?: "default" | "sm" | "lg";
  className?: string;
}) {
  const color = PALETTE[hashName(name || "?") % PALETTE.length];

  return (
    <Avatar size={size} className={cn("after:hidden", className)}>
      <AvatarFallback
        style={{ backgroundColor: color, color: "white" }}
        className="font-medium"
      >
        {initials(name || "?") || "?"}
      </AvatarFallback>
    </Avatar>
  );
}
