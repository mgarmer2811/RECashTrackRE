"use client";

import { useState } from "react";
import supabase from "../../utils/SupabaseClient";
import EmailIcon from "@/components/EmailIcon";
import DollarIcon from "@/components/DollarIcon";

export default function RecoverPage() {
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendReset = async (event) => {
    event.preventDefault();
    setStatusMsg(null);
    setLoading(true);

    const redirectTo = "http://localhost:3000/reset";
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Reset password error: ", error.message);
      }
    }

    setStatusMsg(
      "If that email exists in our system, a password reset link has been sent. Check your inbox."
    );
  };

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-200">
        <div className="flex justify-center mb-6">
          <DollarIcon size={64} absoluteStrokeWidth={false} />
        </div>
        <h1 className="text-2xl font-bold text-center mb-3 text-blue-700">
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
              onChange={(event) => setEmail(event.target.value)}
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
            <p className={"text-sm text-center text-blue-600"}>{statusMsg}</p>
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
