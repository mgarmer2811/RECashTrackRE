"use client";

import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Topbar from "@/components/Topbar";
import FamilyGoalsRenderer from "@/components/FamilyGoalsRenderer";
import FamilyContributionRenderer from "@/components/FamilyContributionRenderer";
import FabFamilyCreateGoal from "@/components/FabFamilyCreateGoal";

export default function FamilyPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [currentFamily, setCurrentFamily] = useState(null);
  const [currentGoals, setCurrentGoals] = useState([]);

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
      <div className="md:hidden w-full px-5 pt-20 md:pt-0">
        <FamilyGoalsRenderer
          userId={user.id}
          onSelectedFamilyChange={(family, goals) => {
            setCurrentFamily(family);
            setCurrentGoals(goals ?? []);
          }}
        />
        <FamilyContributionRenderer
          userId={user.id}
          family={currentFamily}
          goals={currentGoals}
        />
        <FabFamilyCreateGoal userId={user.id} family={currentFamily} />
      </div>
    </>
  );
}
