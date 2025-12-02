"use client";

import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import DoughnutChart from "@/components/DoughnutChart";
import CreateGoal from "@/components/CreateGoal";
import GoalsRenderer from "@/components/GoalsRenderer";
import CreateTransaction from "@/components/Clipboard";
import TransactionRenderer from "@/components/TransactionRenderer";
import FabCreateTransaction from "@/components/FabCreateTransaction";
import TabBar from "@/components/TabBar";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

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
      {/* Phone view */}
      <Topbar />
      <div className="md:hidden w-full px-5 pt-20 md:pt-0">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === 0 && (
          <div className="w-full mx-auto flex flex-col items-center gap-4 mb-4 h-screen overflow-hidden">
            <div className="w-full">
              <DoughnutChart userId={user.id} />
            </div>
            <div className="w-full flex-grow overflow-hidden">
              <TransactionRenderer userId={user.id} />
            </div>
            <FabCreateTransaction userId={user.id} />
          </div>
        )}

        {activeTab === 1 && <></>}
      </div>
      {/* Desktop view */}
      {/*<div className="hidden md:flex">
        <div className="flex w-full">
          <div className="mt-[5vh]">
            <Sidebar />
          </div>

          <div className="flex-1 flex justify-center">
            <div className="w-full max-w-4xl my-[5vh] flex flex-col gap-8 overflow-y-auto px-4">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <DoughnutChart userId={user.id} />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <GoalsRenderer userId={user.id} />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <CreateGoal userId={user.id} />
              </div>

              <div className="bg-white p-6 rounded-xl shadow-lg"></div>

              <div className="bg-white p-6 rounded-xl shadow-lg">
                <CreateTransaction userId={user.id} />
              </div>
            </div>
          </div>
        </div>
      </div>*/}
    </>
  );
}
