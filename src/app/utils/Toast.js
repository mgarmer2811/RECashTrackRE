import { toast } from "react-hot-toast";
import { CheckCircle, CircleQuestionMark, XCircle, X } from "lucide-react";

const baseContainerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 14,
  padding: "12px 16px",
  borderRadius: 8,
  fontWeight: 700,
  boxShadow:
    "0 8px 24px rgba(15, 23, 42, 0.12), 0 3px 8px rgba(15, 23, 42, 0.06)",
  minWidth: 240,
  minHeight: 56,
};

export function showSuccess(message = "Success", opts = {}) {
  toast.custom(
    (t) => (
      <div
        style={{
          ...baseContainerStyle,
          background: "#2563EB",
          color: "#ffffff",
          paddingRight: 16,
        }}
      >
        <CheckCircle size={20} color="#ffffff" style={{ flexShrink: 0 }} />
        <div style={{ lineHeight: 1.25 }}>{message}</div>
      </div>
    ),
    {
      position: "top-center",
      duration: opts.duration ?? 3000,
      ...opts,
    }
  );
}

export function showError(message = "Error", opts = {}) {
  toast.custom(
    (t) => (
      <div
        style={{
          ...baseContainerStyle,
          background: "#DC2626",
          color: "#ffffff",
          paddingRight: 16,
        }}
      >
        <XCircle size={20} color="#ffffff" style={{ flexShrink: 0 }} />
        <div style={{ lineHeight: 1.25 }}>{message}</div>
      </div>
    ),
    {
      position: "top-center",
      duration: opts.duration ?? 3000,
      ...opts,
    }
  );
}
