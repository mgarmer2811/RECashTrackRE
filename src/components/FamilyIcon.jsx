import { UsersRound } from "lucide-react";

export default function FamilyIcon({
  color = "#2563eb",
  size = 24,
  strokeWidth,
  absoluteStrokeWidth = true,
}) {
  return (
    <UsersRound
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
    />
  );
}
