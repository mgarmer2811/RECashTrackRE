"use client";

import FamilySettings from "@/components/FamilySettings";
import { useAuth } from "../../utils/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Family() {
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

  return <FamilySettings user={user} />;
}
