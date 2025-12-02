"use client";

import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import FamilyGoalsRenderer from "@/components/FamilyGoalsRenderer";

export default function FamilyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading, router]);

  if (loading) {
    return <p>Loading user info...</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Topbar />
      <div className="hidden md:flex">
        <div className="flex w-full">
          <div className="mt-5[vh]">
            <Sidebar />
          </div>
        </div>
        <div className="flex-1 flex justify center">
          <div className="w-full max-w-4xl my-[5vh] flex flex-col gap-8 overflow-y-auto px-4">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <FamilyGoalsRenderer userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
