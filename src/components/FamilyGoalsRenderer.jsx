"use client";

import { useState, useEffect, useRef } from "react";
import GoalCard from "./GoalCard";
import { io } from "socket.io-client";

export default function FamilyGoalsRenderer({ userId }) {
  const [families, setFamilies] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState(null);
  const [familyGoals, setFamilyGoals] = useState({});
  const [currents, setCurrents] = useState({});
  const [percents, setPercents] = useState({});
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const familyDisplayName = (f) => f.name ?? "Family";

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
        const baseUrl = process.env.GET_FAMILIES;
        const url = baseUrl
          ? `${baseUrl}?userId=${userId}`
          : `http://localhost:5050/api/family/get?userId=${userId}`;

        const res = await fetch(url, {
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
            const baseUrl = process.env.GET_GOALS;
            const url = baseUrl
              ? `${baseUrl}?familyId=${family.id}&userId=${userId}`
              : `http://localhost:5050/api/goals/get?familyId=${family.id}&userId=${userId}`;
            const res = await fetch(url, { signal });
            if (!res.ok) {
              return { goals: [] };
            }
            return await res.json();
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

    return () => {
      controller.abort();
    };
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
    if (!socket || !socket.connected) return;

    try {
      const prev = socket.currentFamily;
      if (typeof prev !== "undefined" && prev !== null) {
        socket.emit("leave", { familyId: prev });
      }
    } catch (err) {
      // ignore
    } finally {
      if (selectedFamilyId !== null) {
        socket.emit("join", { familyId: selectedFamilyId });
        socket.currentFamily = selectedFamilyId;
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
  }, [selectedFamilyId]);

  const onUpdate = async (goalId, data) => {
    const baseUrl = process.env.UPDATE_GOAL;
    const url = baseUrl
      ? `${baseUrl}${goaldId}?userId=${userId}&familyId=${selectedFamilyId}`
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
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("onUpdate error:", error);
      throw error;
    }
  };

  const onDelete = async (goalId) => {
    const baseUrl = process.env.DELETE_GOAL;
    const url = baseUrl
      ? `${baseUrl}${goalId}?userId=${userId}`
      : `http://localhost:5050/api/goals/delete/${goalId}?userId=${userId}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development")
        console.error("onDelete error:", error);
      throw error;
    }
  };

  const displayedGoals = familyGoals[String(selectedFamilyId)] || [];

  if (loading) {
    return <p>Loading goals & families…</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {(() => {
            const sel = families.find(
              (f) => String(f.id) === String(selectedFamilyId)
            );
            return sel ? familyDisplayName(sel) : "Goals";
          })()}
        </h2>
        <div className="flex items-center gap-4">
          <label htmlFor="familySelect" className="mr-2">
            Show:
          </label>
          <select
            id="familySelect"
            value={selectedFamilyId === null ? "" : String(selectedFamilyId)}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedFamilyId(val === "" ? null : Number(val));
              if (val !== "") {
                setFamilyGoals((prev) => ({
                  ...prev,
                  [String(val)]: prev[String(val)] ?? [],
                }));
              }
            }}
            className="border px-2 py-1 rounded"
          >
            <option value="">(select family)</option>
            {families.map((f) => (
              <option key={String(f.id)} value={String(f.id)}>
                {familyDisplayName(f)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {displayedGoals.length === 0 ? (
          <p className="text-sm text-gray-500">No goals for this family</p>
        ) : (
          displayedGoals.map((g) => {
            const gid = String(g.id);
            return (
              <GoalCard
                key={gid}
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
              />
            );
          })
        )}
      </div>
    </div>
  );
}
