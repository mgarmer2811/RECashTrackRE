"use client";

import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";

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
          <aside className="flex-shrink-0 w-[clamp(12rem,14vw,16vw)] mt-[5vh] mr-6">
            <Sidebar />
          </aside>
        </div>
      </div>
    </>
  );
}
