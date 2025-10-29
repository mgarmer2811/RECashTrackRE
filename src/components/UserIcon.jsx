import { UserRound } from "lucide-react";

export default function UserIcon({
  color = "#2563eb",
  size = 24,
  strokeWidth,
  absoluteStrokeWidth = true,
}) {
  return (
    <UserRound
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
    />
  );
}
