"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "../utils/SupabaseClient";
import DollarIcon from "@/components/DollarIcon";
import EmailIcon from "@/components/EmailIcon";
import PasswordIcon from "@/components/PasswordIcon";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSignIn = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      console.log("Error while loggin in: ", error.message);
    } else {
      router.push("/"); //home page
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-xl border border-gray-200">
        <div className="flex justify-center mb-6">
          <DollarIcon size={64} absoluteStrokeWidth={false} />
        </div>
        <h1
          className="text-2xl font-bold text-center mb-2"
          style={{ color: "#2563eb" }}
        >
          CashTrack
        </h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter your credentials to continue
        </p>

        <form onSubmit={handleSignIn} className="space-y-5">
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

          <div className="flex items-center border border-gray-300 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <PasswordIcon />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full ml-3 outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 rounded-lg text-white font-bold bg-blue-600 hover:bg-blue-700"
          >
            Sign In
          </button>

          {errorMsg && (
            <p className="text-red-500 text-sm text-center">
              Incorrect credentials
            </p>
          )}
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account yet?{" "}
          <a href="/signup" className="text-blue-600">
            <u>Sign Up</u>
          </a>
        </p>
      </div>
    </div>
  );
}
