"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../utils/SupabaseClient";
import PasswordIcon from "@/components/PasswordIcon";
import DollarIcon from "@/components/DollarIcon";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const hasToken =
      hash.includes("access_token=") ||
      hash.includes("type=recovery") ||
      search.includes("access_token=") ||
      search.includes("type=recovery");

    if (!hasToken) {
      router.replace("/signin");
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        try {
          const cleanUrl = window.location.pathname;
          window.history.replaceState(null, "", cleanUrl);
        } catch (error) {
          if (process.env.NODE_ENV === "development") {
            console.error("Browser error: ", error.message);
          }
        }
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [router]);

  const handlePasswordReset = async (event) => {
    event.preventDefault();
    setStatusMsg(null);
    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setLoading(false);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Reset password error: ", error.message);
      }
      setStatusMsg({
        type: "error",
        text: "An error occured while resetting your password.",
      });
    } else {
      setStatusMsg({
        type: "success",
        text: "Password changed successfully! Redirecting...",
      });

      setTimeout(() => router.replace("/signin"), 1750);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-200">
        <div className="flex justify-center mb-6">
          <DollarIcon size={64} absoluteStrokeWidth={false} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-blue-700">
          RECashTrack
        </h1>
        <h2 className="text-lg font-bold text-center mb-2 text-gray-700">
          Reset password
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your new password below.
        </p>

        <form onSubmit={handlePasswordReset} className="space-y-5">
          <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <PasswordIcon />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              minLength={6}
              className="w-full ml-3 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((showPassword) => !showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2 p-1 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                <Eye size={18} color="#2563eb" />
              ) : (
                <EyeOff size={18} />
              )}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Updating..." : "Update password"}
          </button>

          {statusMsg && (
            <p
              className={`text-sm text-center ${
                statusMsg.type === "error" ? "text-red-500" : "text-blue-700"
              }`}
            >
              {statusMsg.text}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Remembered your password?
          <a href="/signin" className="text-blue-600 underline ml-1">
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
