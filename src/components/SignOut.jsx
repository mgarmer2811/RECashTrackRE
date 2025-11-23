"use client";

import supabase from "@/app/utils/SupabaseClient";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function SignOut() {
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/signin");
  };

  return (
    <div className="bg-white w-full max-w-full p-6 rounded-xl shadow border border-gray-200">
      <div className="flex flex-col items-center text-center">
        <LogOut className="w-10 h-10 text-red-600 mb-3" />

        <h3 className="text-lg font-semibold mb-2 text-gray-700">Sign Out</h3>

        <p className="text-sm text-gray-600 mb-4">
          Sign out of your account on this device.
        </p>

        <button
          onClick={handleSignOut}
          className="w-full py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
