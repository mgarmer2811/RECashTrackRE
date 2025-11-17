"use client";

import { useEffect, useState } from "react";
import { MoveLeft, ArrowRight, ArrowDown, Ban } from "lucide-react";
import { toast } from "react-hot-toast";
import FamilyIcon from "./FamilyIcon";

export default function FamilySettings({ user }) {
  const [view, setView] = useState("initial");
  const [createdFamilies, setCreatedFamilies] = useState([]);
  const [joinedFamilies, setJoinedFamilies] = useState([]);
  const [joinName, setJoinName] = useState("");
  const [createName, setCreateName] = useState("");
  const [leaveId, setLeaveId] = useState("");
  const [dissolveId, setDissolveId] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDissolving, setIsDissolving] = useState(false);

  function totalFamiliesCount() {
    return createdFamilies.length + joinedFamilies.length;
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    fetchFamilies();
  }, [user]);

  async function fetchFamilies() {
    try {
      let url = `http://localhost:5050/api/family?userId=${user.id}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        let errorData = await res.json();
        let errorMessage = errorData.message;
        throw new Error(errorMessage);
      }
      const data = await res.json();
      setCreatedFamilies(data.createdFamilies);
      setJoinedFamilies(data.joinedFamilies);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleJoin(e) {
    e.preventDefault();
    if (joinName.length !== 10) {
      return;
    }
    if (totalFamiliesCount() >= 3) {
      return;
    }

    setIsJoining(true);
    try {
      let url = `http://localhost:5050/api/family/join?userId=${user.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: joinName }),
      });
      if (!res.ok) {
        let errorData = await res.json();
        let errorMessage = errorData.message;
        throw new Error(errorMessage);
      }
      setJoinName("");
      await fetchFamilies();
    } catch (err) {
      console.error(err);
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (createName.length !== 10) {
      return;
    }
    if (totalFamiliesCount() >= 3) {
      return;
    }

    setIsCreating(true);
    try {
      let url = `http://localhost:5050/api/family/create?userId=${user.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: createName }),
      });
      if (!res.ok) {
        let errorData = await res.json();
        let errorMessage = errorData?.message || "Failed to create family";
        throw new Error(errorMessage);
      }
      setCreateName("");
      await fetchFamilies();
      toast.success("Family created");
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLeave() {
    if (!leaveId) return;
    setIsLeaving(true);
    try {
      let url = `http://localhost:5050/api/family/${leaveId}?userId=${user.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        let errorData = await res.json();
        let errorMessage = errorData.message;
        throw new Error(errorMessage);
      }
      setLeaveId("");
      await fetchFamilies();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLeaving(false);
    }
  }

  async function handleDissolve() {
    /** Just in case checks */
    if (!dissolveId) return;
    const familyToDissolve = createdFamilies.find(
      (family) => family.id == dissolveId
    );
    if (!familyToDissolve) return;

    const confirmed = window.confirm(
      `Are you sure you want to dissolve "${familyToDissolve.name}"? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsDissolving(true);
    try {
      let url = `http://localhost:5050/api/family/${dissolveId}?userId=${user.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        let errorData = await res.json();
        let errorMessage = errorData.message;
        throw new Error(errorMessage);
      }
      setDissolveId("");
      await fetchFamilies();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDissolving(false);
    }
  }

  const leaveableFamilies = joinedFamilies;
  const totalCount = totalFamiliesCount();

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-2xl mx-4">
        <div className="relative bg-white rounded-lg shadow-lg border border-gray-100 p-4 min-h-[54vh]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {view !== "initial" && (
                <button
                  onClick={() => setView("initial")}
                  className="px-2 py-1 rounded hover:bg-gray-100"
                  aria-label="Go back"
                >
                  <MoveLeft />
                </button>
              )}
              <h2 className="text-lg font-semibold">Family Management</h2>
            </div>
            <div className="text-sm text-gray-500">
              {totalCount} / 3 Families
            </div>
          </div>
          <div>
            {view === "initial" && (
              <>
                <p className="text-gray-700 text-sm mb-4">
                  Families enable users to collaborate on managing savings and
                  expenses, while also setting milestones for the group. A user
                  has the ability to both create new families and join existing
                  ones.
                </p>
                <p className="text-gray-700 text-sm mb-4 italic">
                  *Free-tier users are allowed to be a member of up to three
                  families, which includes both families they have created and
                  those they have joined.
                </p>
                <div className="hidden md:flex flex-col items-center mt-4">
                  <p className="text-black text-sm text-center mb-2">
                    Click one button to proceed
                  </p>
                  <ArrowDown color="#000000" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:mt-6">
                  {/* Join/Create */}
                  <div
                    onClick={() => setView("joincreate")}
                    className="cursor-pointer p-6 rounded-lg bg-transparent border-2 border-blue-500 text-blue-600 min-h-[140px] flex flex-col hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-blue-600/90 mb-3 text-start font-semibold">
                      Join an existing family by name, or create a new family.
                    </p>
                    <div className="mt-auto flex flex-col items-center">
                      <h4 className="text-md font-semibold italic">
                        JOIN / CREATE
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <ArrowRight />
                        <FamilyIcon />
                      </div>
                    </div>
                  </div>

                  {/* Leave/Dissolve*/}
                  <div
                    onClick={() => setView("leavedissolve")}
                    className="cursor-pointer p-6 rounded-xl bg-transparent border-2 border-red-500 text-red-600 min-h-[140px] flex flex-col hover:shadow-md transition-shadow"
                  >
                    <p className="text-sm text-red-600/90 mb-3 text-start font-semibold">
                      Leave a family you joined, or dissolve a family you've
                      created.
                    </p>

                    <div className="mt-auto flex flex-col items-center">
                      <h4 className="text-md font-semibold italic">
                        LEAVE / DISSOLVE
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Ban />
                        <FamilyIcon color="#DC2626" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Join/Create view */}
            {view === "joincreate" && (
              <div className="space-y-4">
                {/* Join */}
                <section className="p-3 rounded-lg border border-gray-100 bg-white">
                  <h4 className="font-medium mb-2">Join a family</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Enter the name of the family you want to join in the textbox
                    below. Family names are 10 characters long.
                  </p>

                  <form
                    onSubmit={handleJoin}
                    className="flex flex-col sm:flex-row gap-3 items-stretch"
                  >
                    <input
                      value={joinName}
                      onChange={(e) => setJoinName(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Eg: xxx1xxx"
                      minLength="10"
                      maxLength="10"
                    />
                    <button
                      type="submit"
                      disabled={
                        isJoining || totalCount >= 3 || joinName.length !== 10
                      }
                      className="min-w-[140px] sm:min-w-[160px] py-3 bg-blue-600 text-white rounded-md disabled:opacity-60 text-center font-medium font-semibold"
                    >
                      {isJoining ? "Joining…" : "Join"}
                    </button>
                  </form>

                  {totalCount >= 3 && (
                    <p className="mt-2 text-sm text-gray-500">
                      You have reached the maximum of 3 families.
                    </p>
                  )}
                </section>

                {/* Create */}
                <section className="p-3 rounded-lg border border-gray-100 bg-white">
                  <h4 className="font-medium mb-2">Create a family</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Create a family with a unique name, with a maximum of three
                    families in total (including both created and joined
                    families).
                  </p>

                  <form
                    onSubmit={handleCreate}
                    className="flex flex-col sm:flex-row gap-3 items-stretch"
                  >
                    <input
                      value={createName}
                      onChange={(e) => setCreateName(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      placeholder="Eg: xxx1xxx"
                      disabled={isCreating || totalCount >= 3}
                      minLength="10"
                      maxLength="10"
                    />
                    <button
                      type="submit"
                      disabled={
                        isCreating ||
                        totalCount >= 3 ||
                        createName.length !== 10
                      }
                      className="min-w-[140px] sm:min-w-[160px] py-3 bg-green-600 text-white rounded-md disabled:opacity-60 text-center font-medium font-semibold"
                    >
                      {isCreating ? "Creating…" : "Create"}
                    </button>
                  </form>

                  {createdFamilies.length > 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      You created:{" "}
                      <strong>
                        {createdFamilies
                          .map((family) => family.name)
                          .join(", ")}
                      </strong>
                    </p>
                  )}
                </section>
              </div>
            )}

            {/* Leave/Dissolve view */}
            {view === "leavedissolve" && (
              <div className="space-y-4">
                {/* Leave */}
                <section className="p-3 rounded-lg border border-gray-100 bg-white">
                  <h4 className="font-medium mb-2">Leave a family</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Choose a family you are a member of (not your created
                    family) and leave it.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <select
                      value={leaveId}
                      onChange={(e) => setLeaveId(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      aria-label="Select family to leave"
                    >
                      <option value="">-- Select family --</option>
                      {leaveableFamilies.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleLeave}
                      disabled={!leaveId || isLeaving}
                      className="min-w-[140px] sm:min-w-[160px] py-3 bg-red-600 text-white rounded-md disabled:opacity-60 text-center font-medium font-semibold"
                    >
                      {isLeaving ? "Leaving…" : "Leave"}
                    </button>
                  </div>

                  {leaveableFamilies.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      You are not a member of any other family besides your own.
                    </p>
                  )}
                </section>

                {/* Dissolve */}
                <section className="p-3 rounded-lg border border-gray-100 bg-white">
                  <h4 className="font-medium mb-2">Dissolve your family</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Dissolving your family will remove it for everyone. Only
                    available if you created one.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                    <select
                      value={dissolveId}
                      onChange={(e) => setDissolveId(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md"
                      aria-label="Select created family to dissolve"
                    >
                      <option value="">-- Select family --</option>
                      {createdFamilies.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={handleDissolve}
                      disabled={
                        createdFamilies.length === 0 ||
                        !dissolveId ||
                        isDissolving
                      }
                      className="min-w-[140px] sm:min-w-[160px] py-3 bg-red-700 text-white rounded-md disabled:opacity-60 text-center font-medium font-semibold"
                    >
                      {isDissolving ? "Dissolving…" : "Dissolve"}
                    </button>
                  </div>

                  {createdFamilies.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      You haven't created any family yet.
                    </p>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
