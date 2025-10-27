import { Mail } from "lucide-react";

export default function EmailIcon({
  color = "#2563eb",
  size = 24,
  strokeWidth,
  absoluteStrokeWidth = true,
}) {
  return (
    <Mail
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
    />
  );
}
