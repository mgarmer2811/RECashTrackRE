"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../utils/SupabaseClient";
import DollarIcon from "@/components/DollarIcon";
import EmailIcon from "@/components/EmailIcon";
import PasswordIcon from "@/components/PasswordIcon";
import UserIcon from "@/components/UserIcon";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatusMsg(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Sign up error: ", error);
      }
      setStatusMsg({
        type: "error",
        text: "An error occurred",
      });
    } else {
      const user = data.user;
      try {
        let url = `http://localhost:5050/api/name/create?userId=${user.id}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: username }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
      }

      setStatusMsg({
        text: "Check your inbox to confirm email.",
      });
      setTimeout(() => {
        router.replace("/signin");
      }, 1750);
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
        <p className="text-sm text-gray-600 text-center mb-6">
          Create an account to start using <i>CashTrack</i>
        </p>

        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <UserIcon />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
              className="w-full ml-3 outline-none"
            />
          </div>

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

          <div className="relative flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <PasswordIcon />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full ml-3 outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
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
            className={`w-full py-2 rounded-lg text-white font-bold ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          {statusMsg && (
            <p className="text-sm text-center text-blue-700">
              {statusMsg.text}
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?
          <a href="/signin" className="text-blue-600 ml-1">
            <u>Sign In</u>
          </a>
        </p>
      </div>
    </div>
  );
}
