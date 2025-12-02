"use client";

import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import FamilySettings from "@/components/FamilySettings";
import SignOut from "@/components/SignOut";
import ChangeName from "@/components/ChangeName";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import MobileAccordion from "@/components/MobileAccordion";

export default function SettingsPage() {
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

  const panels = [
    {
      key: "family",
      title: "Family Settings",
      subtitle: "Manage or join families",
      content: <FamilySettings user={user} />,
    },
    {
      key: "displayName",
      title: "Choose a display name",
      subtitle: "How your name appears in families",
      content: <ChangeName user={user} />,
    },
    {
      key: "signout",
      title: "Sign out",
      subtitle: "Sign out of this device",
      content: <SignOut />,
    },
  ];

  return (
    <>
      <Topbar />
      <div className="w-full px-4 md:px-6 pt-20 md:pt-0">
        <div className="w-full max-w-6xl mx-auto md:hidden">
          <MobileAccordion panels={panels} />
        </div>
      </div>

      <div className="hidden md:flex">
        <div className="flex w-full">
          <div className="mt-[5vh]">
            <Sidebar />
          </div>

          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-6xl mt-[5vh] h-[calc(100vh-10vh)] overflow-auto">
              <div className="flex flex-col gap-6">
                <div>
                  <FamilySettings user={user} />
                </div>
                <div className="grid grid-cols-12 gap-6 items-start">
                  <div className="col-span-12 lg:col-span-8">
                    <ChangeName user={user} />
                  </div>
                  <div className="col-span-12 lg:col-span-4">
                    <SignOut />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
