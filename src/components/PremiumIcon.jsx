import { CircleStar } from "lucide-react";

export default function PremiumIcon({
  color = "#2563eb",
  size = 24,
  strokeWidth,
  absoluteStrokeWidth = true,
}) {
  return (
    <CircleStar
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
    />
  );
}
