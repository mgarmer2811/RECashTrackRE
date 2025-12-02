import { useState, useEffect, useRef } from "react";
import GoalCard from "./GoalCard";
import { io } from "socket.io-client";
import { showSuccess, showError } from "@/app/utils/Toast";

export default function GoalsRenderer({ userId }) {
  const [goals, setGoals] = useState([]);
  const [currents, setCurrents] = useState({});
  const [percents, setPercents] = useState({});
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);

    const fetchGoals = async () => {
      try {
        let url = `http://localhost:5050/api/goals/get?userId=${userId}`;

        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal,
        });

        if (!res.ok) {
          if (signal.aborted) return;
          const error = await res.json();
          throw new Error(error.message);
        }

        const data = await res.json();

        if (!signal.aborted) {
          const fetchedGoals = data.goals ?? [];
          setGoals(fetchedGoals ?? []);

          const defaultCurrents = {};
          const defaultPercents = {};
          for (const goal of fetchedGoals) {
            defaultCurrents[goal.id] = Number(goal.current) || 0;
            defaultPercents[goal.id] = {
              percentDisplayed: Number(goal.percentDisplayed) || 0,
              barPercent: Number(goal.barPercent) || (goal.type ? 100 : 0),
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
          }
          setCurrents(defaultCurrents);
          setPercents(defaultPercents);
        }
      } catch (error) {
        if (signal.aborted) return;

        if (process.env.NODE_ENV === "development") {
          console.error(error.message);
        }
        showError("Unexpected error. Could not load goals");
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchGoals();

    return () => {
      controller.abort();
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }
    const socket = io("http://localhost:5050");
    socketRef.current = socket;
    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
      socket.emit("join", { userId });
    });

    socket.on("goal:created", (payload) => {
      const { goal, current, percentDisplayed, barPercent, remaining } =
        payload;

      if (!goal) {
        return;
      }

      setGoals((gs) => {
        const exists = gs.some((g) => g.id === goal.id);
        if (exists) {
          return gs;
        }
        return [...gs, { ...goal }];
      });

      setCurrents((c) => ({ ...c, [goal.id]: current ?? 0 }));
      setPercents((p) => ({
        ...p,
        [goal.id]: {
          percentDisplayed: percentDisplayed ?? 0,
          barPercent: barPercent ?? (goal.type ? 100 : 0),
          remaining:
            typeof remaining !== "undefined"
              ? remaining
              : goal.type
              ? Number(goal.quantity) || 0
              : null,
        },
      }));
    });

    socket.on("goal:updated", (payload) => {
      const { goal, current, percentDisplayed, barPercent, remaining } =
        payload;

      if (!goal && !goal.id) {
        return;
      }

      const id = Number(goal.id);
      if (!id) {
        return;
      }

      setGoals((gs) => {
        const exists = gs.some((g) => Number(g.id) === id);
        if (exists) {
          return gs.map((g) =>
            Number(g.id) === id ? { ...g, ...goal, id } : g
          );
        }
        return [...gs, { ...goal, id }];
      });

      setCurrents((c) => ({ ...c, [id]: current ?? c[id] ?? 0 }));

      setPercents((p) => ({
        ...p,
        [id]: {
          percentDisplayed: percentDisplayed ?? p[id]?.percentDisplayed ?? 0,
          barPercent: barPercent ?? p[id]?.barPercent ?? (goal?.type ? 100 : 0),
          remaining:
            typeof remaining !== "undefined"
              ? remaining
              : p[id]?.remaining ??
                (goal?.type ? Number(goal.quantity) || 0 : null),
        },
      }));
    });

    socket.on("goal:deleted", ({ goalId }) => {
      setGoals((gs) => gs.filter((g) => g.id !== goalId));
      setCurrents((c) => {
        const copy = { ...c };
        delete copy[goalId];
        return copy;
      });
      setPercents((p) => {
        const copy = { ...p };
        delete copy[goalId];
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
          socketRef.current.emit("leave", { userId });
        }
      } finally {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  const onUpdate = async (goalId, data) => {
    let url = `http://localhost:5050/api/goals/update/${goalId}?userId=${userId}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      const result = await res.json();
    } catch (error) {
      throw error;
    }
  };

  const onDelete = async (goalId) => {
    let url = `http://localhost:5050/api/goals/delete/${goalId}?userId=${userId}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
    } catch (error) {
      throw error;
    }
  };

  if (loading) {
    return <p>Loading user data</p>;
  }

  return (
    <div className="space-y-2 p-6">
      {goals.map((g) => (
        <GoalCard
          key={g.id}
          goal={g}
          current={currents[g.id] ?? 0}
          percentDisplayed={percents[g.id]?.percentDisplayed ?? 0}
          barPercent={percents[g.id]?.barPercent ?? (g.type ? 100 : 0)}
          remaining={
            typeof percents[g.id]?.remaining !== "undefined"
              ? percents[g.id].remaining
              : g.type
              ? Math.max(0, Number(g.quantity) - (currents[g.id] ?? 0))
              : null
          }
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
