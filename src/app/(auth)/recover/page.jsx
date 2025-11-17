"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../utils/SupabaseClient";
import EmailIcon from "@/components/EmailIcon";
import DollarIcon from "@/components/DollarIcon";

export default function RecoverPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (e) => {
    e.preventDefault();
    setStatusMsg(null);
    setLoading(true);

    const redirectTo = "http://localhost:3000/reset";
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setStatusMsg({
        type: "error",
        text: "The entered email doesn't exist in the database",
      });
      console.error("Reset password error:", error);
    } else {
      setStatusMsg({
        type: "success",
        text: "If that email exists in our system, a password reset link has been sent. Check your inbox.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-200">
        <div className="flex justify-center mb-6">
          <DollarIcon size={64} absoluteStrokeWidth={false} />
        </div>
        <h1
          className="text-2xl font-bold text-center mb-3"
          style={{ color: "#2563eb" }}
        >
          RECashTrack
        </h1>
        <h2 className="text-lg font-bold text-center mb-2 text-gray-700">
          Recover password
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email and we'll send you a link to reset your password.
        </p>

        <form onSubmit={handleSendReset} className="space-y-5">
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <EmailIcon />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full ml-3 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700"
          >
            {loading ? "Sending..." : "Send reset email"}
          </button>

          {statusMsg && (
            <p
              className={`text-sm text-center ${
                statusMsg.type === "error" ? "text-red-500" : "text-blue-600"
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
