"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../../utils/SupabaseClient";
import DollarIcon from "@/components/DollarIcon";
import EmailIcon from "@/components/EmailIcon";
import PasswordIcon from "@/components/PasswordIcon";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg("Incorrect credentials / Email not confirmed");
      if (process.env.NODE_ENV === "development") {
        console.error("Error while loggin in: ", error.message);
      }
    } else {
      router.replace("/");
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
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSignIn} className="space-y-5">
          <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
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
          <div className="relative flex items-center border border-gray-300 rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <PasswordIcon />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
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

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="w-full py-2 rounded-md text-white font-bold bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>

          {errorMsg && (
            <p className="text-red-500 text-sm text-center">{errorMsg}</p>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account yet?
          <a href="/signup" className="text-blue-600 ml-1">
            <u>Sign Up</u>
          </a>
        </p>

        <p className="text-center text-sm text-gray-600 mt-4">
          Forgotten password?
          <a href="/recover" className="text-blue-600 ml-1">
            <u>Reset</u>
          </a>
        </p>
      </div>
    </div>
  );
}
