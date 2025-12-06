"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import FamilyGoalCard from "@/components/FamilyGoalCard";
import { io } from "socket.io-client";
import { ShieldBan, Flame, CircleCheckBig } from "lucide-react";

function FilterButton({ active, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`min-w-[44px] px-2 py-1 rounded-md text-sm font-semibold transition-colors flex items-center justify-center ${
        active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function FamilyGoalsRenderer({
  userId,
  onSelectedFamilyChange = () => {},
}) {
  const [families, setFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [familyGoals, setFamilyGoals] = useState({});
  const [currents, setCurrents] = useState({});
  const [percents, setPercents] = useState({});
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const [typeFilter, setTypeFilter] = useState("all");
  const [showCompleted, setShowCompleted] = useState(false);

  const familyDisplayName = (f) =>
    f && f.name ? String(f.name).toUpperCase() : "FAMILY";

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    const fetchFamiliesAndGoals = async () => {
      setLoading(true);
      try {
        const baseUrlFamilies = process.env.GET_FAMILIES;
        const familiesUrl = baseUrlFamilies
          ? `${baseUrlFamilies}?userId=${userId}`
          : `http://localhost:5050/api/family/get?userId=${userId}`;

        const res = await fetch(familiesUrl, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal,
        });

        if (!res.ok) {
          if (signal.aborted) return;
          const error = await res.json().catch(() => ({}));
          console.error("Family fetch error:", error);
          throw new Error(error.message);
        }

        const data = await res.json();
        const unifiedFamilies = [
          ...(data.createdFamilies ?? []),
          ...(data.joinedFamilies ?? []),
        ];

        const promises = unifiedFamilies.map(async (family) => {
          try {
            const baseUrlGoals = process.env.GET_GOALS;
            const url = baseUrlGoals
              ? `${baseUrlGoals}?familyId=${family.id}&userId=${userId}`
              : `http://localhost:5050/api/goals/get?familyId=${family.id}&userId=${userId}`;
            const r = await fetch(url, { signal });
            if (!r.ok) {
              return { goals: [] };
            }
            return await r.json();
          } catch (err) {
            if (signal.aborted) return { goals: [] };
            console.error(`Failed to fetch goals for family ${family.id}`, err);
            return { goals: [] };
          }
        });

        const results = await Promise.all(promises);
        const goalsMap = {};
        unifiedFamilies.forEach((family, index) => {
          const key = String(family.id);
          goalsMap[key] = results[index]?.goals ?? [];
        });

        const defaultCurrents = {};
        const defaultPercents = {};
        Object.values(goalsMap).forEach((array) => {
          (array || []).forEach((goal) => {
            const gid = String(goal.id);
            defaultCurrents[gid] = Number(goal.current) || 0;
            defaultPercents[gid] = {
              percentDisplayed: Number(goal.percentDisplayed) || 0,
              barPercent:
                typeof goal.barPercent !== "undefined"
                  ? Number(goal.barPercent)
                  : goal.type
                  ? 100
                  : 0,
              remaining:
                typeof goal.remaining !== "undefined"
                  ? goal.remaining
                  : goal.type
                  ? Math.max(
                      0,
                      Number(goal.quantity) - (Number(goal.current) || 0)
                    )
                  : null,
            };
          });
        });

        setFamilies(unifiedFamilies);
        setFamilyGoals(goalsMap);
        setCurrents(defaultCurrents);
        setPercents(defaultPercents);

        setSelectedFamilyId((prev) => {
          if (prev !== null && typeof prev !== "undefined") return prev;
          return unifiedFamilies.length > 0
            ? Number(unifiedFamilies[0].id)
            : null;
        });
      } catch (error) {
        if (signal.aborted) return;
        if (process.env.NODE_ENV === "development") {
          console.error("fetchFamiliesAndGoals error:", error);
        }
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchFamiliesAndGoals();

    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = io("http://localhost:5050");
    socketRef.current = socket;

    socket.on("connect", () => {
      if (process.env.NODE_ENV === "development") {
        console.log("socket connected", socket.id);
      }
      if (selectedFamilyId !== null) {
        socket.emit("join", { familyId: selectedFamilyId });
        socket.currentFamily = selectedFamilyId;
      } else {
        socket.currentFamily = null;
      }
    });

    const insertGoalToFamily = (goal) => {
      const fid = String(goal.family_id ?? goal.familyId ?? goal.family);
      setFamilyGoals((prev) => {
        const copy = { ...prev };
        const array = Array.isArray(copy[fid]) ? [...copy[fid]] : [];
        const exists = array.some((g) => String(g.id) === String(goal.id));
        if (exists) {
          const index = array.findIndex(
            (g) => String(g.id) === String(goal.id)
          );
          array[index] = { ...array[index], ...goal };
        } else {
          array.push({ ...goal });
        }
        copy[fid] = array;
        return copy;
      });
    };

    const removeGoalFromFamily = (goalId, familyIdPayload) => {
      const fid = String(familyIdPayload);
      setFamilyGoals((prev) => {
        const copy = { ...prev };
        if (Array.isArray(copy[fid])) {
          copy[fid] = copy[fid].filter((g) => String(g.id) !== String(goalId));
        } else {
          copy[fid] = [];
        }
        return copy;
      });
    };

    socket.on("goal:created", (payload) => {
      if (process.env.NODE_ENV === "development") {
        console.log("goal:created", payload);
      }
      const { goal, current, percentDisplayed, barPercent, remaining } =
        payload || {};
      if (!goal) return;

      insertGoalToFamily(goal);

      const id = String(goal.id);
      setCurrents((c) => ({
        ...c,
        [id]:
          typeof current !== "undefined"
            ? Number(current)
            : Number(goal.current) || 0,
      }));

      setPercents((p) => ({
        ...p,
        [id]: {
          percentDisplayed:
            typeof percentDisplayed !== "undefined"
              ? percentDisplayed
              : p[id]?.percentDisplayed ?? 0,
          barPercent:
            typeof barPercent !== "undefined"
              ? barPercent
              : p[id]?.barPercent ?? (goal?.type ? 100 : 0),
          remaining:
            typeof remaining !== "undefined"
              ? remaining
              : p[id]?.remaining ??
                (goal?.type
                  ? Math.max(
                      0,
                      Number(goal.quantity) - (Number(goal.current) || 0)
                    )
                  : null),
        },
      }));
    });

    socket.on("goal:updated", (payload) => {
      if (process.env.NODE_ENV === "development") {
        console.log("goal:updated", payload);
      }
      const { goal, current, percentDisplayed, barPercent, remaining } =
        payload || {};
      if (!goal || !goal.id) return;

      insertGoalToFamily(goal);

      const id = String(goal.id);
      setCurrents((c) => ({
        ...c,
        [id]:
          typeof current !== "undefined"
            ? Number(current)
            : Number(goal.current) || c[id] || 0,
      }));

      setPercents((p) => ({
        ...p,
        [id]: {
          percentDisplayed:
            typeof percentDisplayed !== "undefined"
              ? percentDisplayed
              : p[id]?.percentDisplayed ?? 0,
          barPercent:
            typeof barPercent !== "undefined"
              ? barPercent
              : p[id]?.barPercent ?? (goal?.type ? 100 : 0),
          remaining:
            typeof remaining !== "undefined"
              ? remaining
              : p[id]?.remaining ??
                (goal?.type
                  ? Math.max(
                      0,
                      Number(goal.quantity) - (Number(goal.current) || 0)
                    )
                  : null),
        },
      }));
    });

    socket.on("goal:deleted", (payload) => {
      if (process.env.NODE_ENV === "development") {
        console.log("goal:deleted", payload);
      }
      const { goalId, familyId } = payload || {};
      if (!goalId) return;
      removeGoalFromFamily(goalId, familyId);

      setCurrents((c) => {
        const copy = { ...c };
        delete copy[String(goalId)];
        return copy;
      });

      setPercents((p) => {
        const copy = { ...p };
        delete copy[String(goalId)];
        return copy;
      });
    });

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("Socket disconnected. Reason: ", reason);
      }
    });

    return () => {
      try {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("leave", {
            familyId: socketRef.current.currentFamily,
          });
        }
      } finally {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId, selectedFamilyId]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      setFamilyGoals((prev) => {
        const key = String(selectedFamilyId);
        if (!key) return prev;
        if (typeof prev[key] === "undefined") {
          return { ...prev, [key]: [] };
        }
        return prev;
      });
      const fam =
        families.find((f) => String(f.id) === String(selectedFamilyId)) ?? null;
      const goals = familyGoals[String(selectedFamilyId)] ?? [];
      onSelectedFamilyChange(fam, goals);
      return;
    }

    try {
      const prev = socket.currentFamily;
      if (typeof prev !== "undefined" && prev !== null) {
        socket.emit("leave", { familyId: prev });
      }
    } catch (err) {
    } finally {
      if (selectedFamilyId !== null) {
        socket.emit("join", { familyId: selectedFamilyId });
        socket.currentFamily = selectedFamilyId;
      } else {
        socket.currentFamily = null;
      }
    }

    setFamilyGoals((prev) => {
      const key = String(selectedFamilyId);
      if (!key) return prev;
      if (typeof prev[key] === "undefined") {
        return { ...prev, [key]: [] };
      }
      return prev;
    });

    const fam =
      families.find((f) => String(f.id) === String(selectedFamilyId)) ?? null;
    const goals = familyGoals[String(selectedFamilyId)] ?? [];
    onSelectedFamilyChange(fam, goals);
  }, [selectedFamilyId]);

  useEffect(() => {
    const fam =
      families.find((f) => String(f.id) === String(selectedFamilyId)) ?? null;
    const goals = familyGoals[String(selectedFamilyId)] ?? [];
    onSelectedFamilyChange(fam, goals);
  }, [familyGoals, selectedFamilyId]);

  useEffect(() => {
    const fam =
      families.find((f) => String(f.id) === String(selectedFamilyId)) ?? null;
    const goals = familyGoals[String(selectedFamilyId)] ?? [];
    onSelectedFamilyChange(fam, goals);
  }, [families]);

  const onUpdate = async (goalId, data) => {
    const baseUrl = process.env.UPDATE_GOAL;
    const url = baseUrl
      ? `${baseUrl}${goalId}?userId=${userId}&familyId=${selectedFamilyId}`
      : `http://localhost:5050/api/goals/update/${goalId}?userId=${userId}&familyId=${selectedFamilyId}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message);
      }
      return await res.json();
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("onUpdate error:", error);
      throw error;
    }
  };

  const onDelete = async (goalId) => {
    const baseUrl = process.env.DELETE_GOAL;
    const url = baseUrl
      ? `${baseUrl}${goalId}?userId=${userId}&familyId=${selectedFamilyId}`
      : `http://localhost:5050/api/goals/delete/${goalId}?userId=${userId}&familyId=${selectedFamilyId}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message);
      }
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("onDelete error:", error);
      throw error;
    }
  };

  const displayedGoals = useMemo(() => {
    const list = familyGoals[String(selectedFamilyId)] ?? [];
    if (!list || list.length === 0) return [];

    let filtered = list.slice();

    if (typeFilter === "true") filtered = filtered.filter((g) => !!g.type);
    else if (typeFilter === "false") filtered = filtered.filter((g) => !g.type);

    if (showCompleted) filtered = filtered.filter((g) => !!g.completed);

    filtered = filtered.sort((a, b) => {
      if (a.created_at && b.created_at)
        return new Date(b.created_at) - new Date(a.created_at);
      return (Number(b.id) || 0) - (Number(a.id) || 0);
    });

    return filtered;
  }, [familyGoals, selectedFamilyId, typeFilter, showCompleted]);

  if (loading) {
    return <p>Loading goals & families…</p>;
  }

  const selectedFamily =
    families.find((f) => String(f.id) === String(selectedFamilyId)) ?? null;

  const safeSelectValue =
    families.length === 0
      ? ""
      : selectedFamilyId !== null
      ? String(selectedFamilyId)
      : String(families[0].id);

  return (
    <div className="w-full h-[50vh] bg-white rounded-xl shadow-lg p-4 mb-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 tracking-wider">
            {selectedFamily ? familyDisplayName(selectedFamily) : "GOALS"}
          </h3>
        </div>

        <div className="flex flex-col items-end">
          {families.length === 0 ? (
            <select
              disabled
              value=""
              className="border px-2 py-1 rounded rounded-md bg-gray-50 text-gray-500 cursor-not-allowed"
              aria-label="Family selector - no families"
            >
              <option value="">NO FAMILIES</option>
            </select>
          ) : (
            <select
              id="familySelect"
              value={safeSelectValue}
              onChange={(e) => {
                const val = e.target.value;
                const parsed = val === "" ? null : Number(val);
                setSelectedFamilyId(parsed);
                if (val !== "") {
                  setFamilyGoals((prev) => ({
                    ...prev,
                    [String(val)]: prev[String(val)] ?? [],
                  }));
                }
              }}
              className="border px-2 py-1 rounded rounded-md"
              aria-label="Family selector"
            >
              {families.map((f) => (
                <option key={String(f.id)} value={String(f.id)}>
                  {familyDisplayName(f)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div className="w-full bg-white rounded-xl shadow p-4 flex flex-col mt-4 flex-1 min-h-0">
        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-700 pt-1">
              Budgets & Savings
            </h3>
            <span className="text-sm text-slate-500">
              {displayedGoals.length} item(s)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <FilterButton
              active={typeFilter === "false"}
              onClick={() =>
                setTypeFilter((prev) => (prev === "false" ? "all" : "false"))
              }
              title="Only non-typed goals"
            >
              <ShieldBan size={16} />
            </FilterButton>

            <FilterButton
              active={typeFilter === "true"}
              onClick={() =>
                setTypeFilter((prev) => (prev === "true" ? "all" : "true"))
              }
              title="Only typed goals"
            >
              <Flame size={16} />
            </FilterButton>

            <FilterButton
              active={showCompleted}
              onClick={() => setShowCompleted((s) => !s)}
              title="Toggle: show only completed goals"
            >
              <CircleCheckBig size={16} />
            </FilterButton>
          </div>
        </div>

        <div className="w-full space-y-3 p-1 mt-4 overflow-y-auto flex-1 h-[40vh] min-h-0">
          {displayedGoals.length === 0 ? (
            <p className="text-sm text-slate-500">
              No goals for this family / selected filters.
            </p>
          ) : (
            displayedGoals.map((g) => {
              const gid = String(g.id);
              const name = g.creatorName;
              return (
                <div key={gid} className="w-full">
                  <FamilyGoalCard
                    goal={g}
                    current={currents[gid] ?? 0}
                    percentDisplayed={percents[gid]?.percentDisplayed ?? 0}
                    barPercent={percents[gid]?.barPercent ?? (g.type ? 100 : 0)}
                    remaining={
                      typeof percents[gid]?.remaining !== "undefined"
                        ? percents[gid].remaining
                        : g.type
                        ? Math.max(0, Number(g.quantity) - (currents[gid] ?? 0))
                        : null
                    }
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    name={name}
                    userId={userId}
                  />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
