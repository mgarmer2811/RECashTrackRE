import { Settings } from "lucide-react";

export default function SettingsIcon({
  color = "#2563eb",
  size = 24,
  strokeWidth,
  absoluteStrokeWidth = true,
}) {
  return (
    <Settings
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      absoluteStrokeWidth={absoluteStrokeWidth}
    />
  );
}
