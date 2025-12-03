"use client";
import { useEffect, useState } from "react";
import { MoveLeft, ArrowRight, Ban } from "lucide-react";
import { showSuccess, showError } from "@/app/utils/Toast";
import FamilyIcon from "./FamilyIcon";

export default function FamilySettingsCard({ user }) {
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
    fetchFamilies();
  }, []);

  async function fetchFamilies() {
    try {
      const baseUrl = process.env.GET_FAMILIES;
      const url = baseUrl
        ? `${baseUrl}?userId=${user.id}`
        : `http://localhost:5050/api/family/get?userId=${user.id}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const data = await res.json();
      setCreatedFamilies(data.createdFamilies);
      setJoinedFamilies(data.joinedFamilies);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
    }
  }

  async function handleJoin(event) {
    event.preventDefault();
    if (joinName.length !== 10) return;
    if (totalFamiliesCount() >= 3) return;
    setIsJoining(true);
    try {
      const baseUrl = process.env.JOIN_FAMILY;
      const url = baseUrl
        ? `${baseUrl}?userId=${user.id}`
        : `http://localhost:5050/api/family/join?userId=${user.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: joinName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      setJoinName("");
      await fetchFamilies();
      showSuccess("Joined family successfully");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError("Unexpected error. Could not join family");
    } finally {
      setIsJoining(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (createName.length !== 10) return;
    if (totalFamiliesCount() >= 3) return;
    setIsCreating(true);
    try {
      const baseUrl = process.env.CREATE_FAMILY;
      const url = baseUrl
        ? `${baseUrl}?userId=${user.id}`
        : `http://localhost:5050/api/family/create?userId=${user.id}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: createName }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      setCreateName("");
      await fetchFamilies();
      showSuccess("Family created successfully");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError("Unexpected error. Could not create family");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleLeave() {
    if (!leaveId) return;
    setIsLeaving(true);
    try {
      const baseUrl = process.env.DELETE_FAMILY;
      const url = baseUrl
        ? `${baseUrl}${leaveId}?userId=${user.id}`
        : `http://localhost:5050/api/family/delete/${leaveId}?userId=${user.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      setLeaveId("");
      await fetchFamilies();
      showSuccess("Left family successfully");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError("Unexpected error. Could not leave family");
    } finally {
      setIsLeaving(false);
    }
  }

  async function handleDissolve() {
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
      const baseUrl = process.env.DELETE_FAMILY;
      const url = baseUrl
        ? `${baseUrl}${leaveId}?userId=${user.id}`
        : `http://localhost:5050/api/family/delete/${leaveId}?userId=${user.id}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      setDissolveId("");
      await fetchFamilies();
      showSuccess("Family dissolved successfully");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError("Unexpected error. Could not dissolve family");
    } finally {
      setIsDissolving(false);
    }
  }

  const leaveableFamilies = joinedFamilies;
  const totalCount = totalFamiliesCount();

  return (
    <div className="w-full">
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
            <h2 className="text-lg font-semibold text-gray-700">
              Family Settings
            </h2>
          </div>
          <div className="text-sm text-gray-500">{totalCount} / 3 Families</div>
        </div>

        <div>
          {view === "initial" && (
            <>
              <p className="text-gray-700 text-sm mb-8">
                Families enable users to collaborate on managing savings and
                expenses, while also setting milestones for the group. A user
                has the ability to both create new families and join existing
                ones.
              </p>
              <p className="text-gray-700 text-sm italic md:mb-20">
                *Free-tier users are allowed to be a member of up to three
                families, which includes both families they have created and
                those they have joined.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setView("joincreate")}
                  className="cursor-pointer p-6 rounded-lg bg-blue-600 text-white min-h-[18vh] flex flex-col items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-300 transition-colors duration-150 shadow-md text-center"
                >
                  <h4 className="text-md font-semibold mb-2">JOIN / CREATE</h4>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-5 h-5" />
                    <FamilyIcon className="w-6 h-6" color="currentColor" />
                  </div>
                </div>

                <div
                  onClick={() => setView("leavedissolve")}
                  className="cursor-pointer p-6 rounded-xl bg-red-600 text-white min-h-[140px] flex flex-col items-center justify-center hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 transition-colors duration-150 shadow-md text-center"
                >
                  <h4 className="text-md font-semibold">LEAVE / DISSOLVE</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Ban className="w-5 h-5" />
                    <FamilyIcon className="w-6 h-6" color="currentColor" />
                  </div>
                </div>
              </div>
            </>
          )}

          {view === "joincreate" && (
            <div className="space-y-4">
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
                    onChange={(event) => setJoinName(event.target.value)}
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
                    onChange={(event) => setCreateName(event.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="Eg: xxx1xxx"
                    disabled={isCreating || totalCount >= 3}
                    minLength="10"
                    maxLength="10"
                  />
                  <button
                    type="submit"
                    disabled={
                      isCreating || totalCount >= 3 || createName.length !== 10
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
                      {createdFamilies.map((family) => family.name).join(", ")}
                    </strong>
                  </p>
                )}
              </section>
            </div>
          )}

          {view === "leavedissolve" && (
            <div className="space-y-4">
              <section className="p-3 rounded-lg border border-gray-100 bg-white">
                <h4 className="font-medium mb-2">Leave a family</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Choose a family you are a member of (not your created family)
                  and leave it.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <select
                    value={leaveId}
                    onChange={(event) => setLeaveId(event.target.value)}
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

              <section className="p-3 rounded-lg border border-gray-100 bg-white">
                <h4 className="font-medium mb-2">Dissolve your family</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Dissolving your family will remove it for everyone. Only
                  available if you created one.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 items-stretch">
                  <select
                    value={dissolveId}
                    onChange={(event) => setDissolveId(event.target.value)}
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
  );
}
