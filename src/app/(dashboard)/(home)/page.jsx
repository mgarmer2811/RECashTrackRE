"use client";

import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import Sidebar from "@/components/Sidebar";
import DoughnutChart from "@/components/DoughnutChart";
import GoalsRenderer from "@/components/GoalsRenderer";
import TransactionRenderer from "@/components/TransactionRenderer";
import FabCreateTransaction from "@/components/FabCreateTransaction";
import TabBar from "@/components/TabBar";
import ContributionRenderer from "@/components/ContributionRenderer";
import FabCreateGoal from "@/components/FabCreateGoal";

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
          <div className="w-full mx-auto flex flex-col items-center gap-4 mb-4 h-screen">
            <div className="w-full">
              <DoughnutChart userId={user.id} />
            </div>
            <div className="w-full flex-1">
              <TransactionRenderer userId={user.id} />
            </div>
            <FabCreateTransaction userId={user.id} />
          </div>
        )}

        {activeTab === 1 && (
          <div className="w-full mx-auto flex flex-col items-center gap-4 mb-4 h-screen">
            <div className="w-full">
              <GoalsRenderer userId={user.id} />
            </div>
            <div className="w-full flex-1">
              <ContributionRenderer userId={user.id} />
            </div>
            <FabCreateGoal userId={user.id} />
          </div>
        )}
      </div>
    </>
  );
}
