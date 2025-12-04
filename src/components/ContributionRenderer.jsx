"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { showError } from "@/app/utils/Toast";
import ContributionCard from "./ContributionCard";
import CreateContributionModal from "./CreateContributionModal";
import { FunnelX, X, Funnel, Plus } from "lucide-react";

const DEPOSIT_CATEGORY = 10;
const WITHDRAW_CATEGORY = 11;

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

export default function ContributionRenderer({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [appliedTypeFilter, setAppliedTypeFilter] = useState(null);
  const [appliedMinQuantity, setAppliedMinQuantity] = useState(null);
  const [appliedMaxQuantity, setAppliedMaxQuantity] = useState(null);
  const [appliedGoalFilter, setAppliedGoalFilter] = useState(null);

  const [draftTypeFilter, setDraftTypeFilter] = useState(null);
  const [draftMinQuantity, setDraftMinQuantity] = useState(0);
  const [draftMaxQuantity, setDraftMaxQuantity] = useState(500);
  const [draftMinUnlimited, setDraftMinUnlimited] = useState(true);
  const [draftMaxUnlimited, setDraftMaxUnlimited] = useState(true);
  const [draftGoalFilter, setDraftGoalFilter] = useState("all");

  const [goals, setGoals] = useState([]);
  const [transactionGoals, setTransactionGoals] = useState([]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;
    setLoading(true);

    const fetchTransactions = async () => {
      try {
        const baseUrl = process.env.GET_TRANSACTIONS;
        const url = baseUrl
          ? `${baseUrl}?userId=${userId}`
          : `http://localhost:5050/api/transactions/get?userId=${userId}`;
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
          const filtered = (data.transactions ?? []).filter(
            (t) => t.type === true
          );
          setTransactions(filtered);
        }
      } catch (error) {
        if (signal.aborted) return;
        if (process.env.NODE_ENV === "development") console.error(error);
        showError("Unexpected error. Could not load transactions");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();
    const { signal } = controller;

    const fetchGoals = async () => {
      try {
        const baseUrl = process.env.GET_GOALS;
        const url = baseUrl
          ? `${baseUrl}?userId=${userId}`
          : `http://localhost:5050/api/goals/get?userId=${userId}`;

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
          setGoals(fetchedGoals);
        }
      } catch (error) {
        if (signal.aborted) return;
        if (process.env.NODE_ENV === "development") {
          console.error(error.message);
        }
        showError("Unexpected error. Could not load goals");
      }
    };

    fetchGoals();

    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();
    const { signal } = controller;

    const fetchTransactionGoals = async () => {
      try {
        const baseUrl = process.env.GET_TRANSACTIONS_TG;
        const url = baseUrl
          ? `${baseUrl}?userId=${userId}`
          : `http://localhost:5050/api/transactions/get/tg?userId=${userId}`;

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
          const tg = data.transactionGoals ?? [];
          setTransactionGoals(tg);
        }
      } catch (error) {
        if (signal.aborted) return;
        if (process.env.NODE_ENV === "development")
          console.error(error.message);
        showError("Unexpected error. Could not load transaction-goal links");
      }
    };

    fetchTransactionGoals();

    return () => controller.abort();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const socket = io("http://localhost:5050");
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { userId });
    });

    socket.on("transaction:created", (payload) => {
      const { transaction } = payload || {};
      if (!transaction || transaction.type !== true) return;

      setTransactions((ts) => {
        const exists = ts.some((t) => t.id === transaction.id);
        if (exists) return ts;
        return [...ts, transaction];
      });
    });

    socket.on("transaction:updated", (payload) => {
      const { transaction } = payload || {};
      if (!transaction || transaction.type !== true) return;
      const id = Number(transaction.id);
      if (!id) return;

      setTransactions((ts) => {
        const exists = ts.some((t) => Number(t.id) === id);
        if (exists) {
          return ts.map((t) =>
            Number(t.id) === id ? { ...t, ...transaction, id } : t
          );
        }
        return [...ts, { ...transaction, id }];
      });
    });

    socket.on("transaction:deleted", (payload) => {
      const { transactionId } = payload || {};
      setTransactions((ts) => ts.filter((t) => t.id !== transactionId));
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

  const onUpdate = async (transactionId, data) => {
    const baseUrl = process.env.UPDATE_TRANSACTION;
    const url = baseUrl
      ? `${baseUrl}${transactionId}?userId=${userId}`
      : `http://localhost:5050/api/transactions/update/${transactionId}?userId=${userId}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
    return await res.json();
  };

  const onDelete = async (transactionId) => {
    const baseUrl = process.env.DELETE_TRANSACTION;
    const url = baseUrl
      ? `${baseUrl}${transactionId}?userId=${userId}`
      : `http://localhost:5050/api/transactions/delete/${transactionId}?userId=${userId}`;
    const res = await fetch(url, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message);
    }
    return true;
  };

  const isFilterApplied = useMemo(() => {
    const noQuantityLimits =
      (appliedMinQuantity === null || appliedMinQuantity === undefined) &&
      (appliedMaxQuantity === null || appliedMaxQuantity === undefined) &&
      (appliedGoalFilter === null || appliedGoalFilter === undefined);
    return !(appliedTypeFilter === null && noQuantityLimits);
  }, [
    appliedTypeFilter,
    appliedMinQuantity,
    appliedMaxQuantity,
    appliedGoalFilter,
  ]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (appliedTypeFilter === "deposit") {
        if (Number(t.category) !== DEPOSIT_CATEGORY) return false;
      } else if (appliedTypeFilter === "withdraw") {
        if (Number(t.category) !== WITHDRAW_CATEGORY) return false;
      }

      if (
        appliedGoalFilter !== null &&
        typeof appliedGoalFilter !== "undefined"
      ) {
        const goalId = Number(appliedGoalFilter);
        const matchedTg = transactionGoals.filter(
          (tg) => Number(tg.goal_id) === goalId
        );

        if (matchedTg.length === 0) return false;
        const matchedIds = new Set(
          matchedTg.map((tg) => Number(tg.transaction_id))
        );
        if (!matchedIds.has(Number(t.id))) return false;
      }

      const q = Number(t.quantity);
      if (!Number.isFinite(q)) return false;
      if (
        appliedMinQuantity !== null &&
        appliedMinQuantity !== undefined &&
        q < appliedMinQuantity
      )
        return false;
      if (
        appliedMaxQuantity !== null &&
        appliedMaxQuantity !== undefined &&
        q > appliedMaxQuantity
      )
        return false;

      return true;
    });
  }, [
    transactions,
    appliedTypeFilter,
    appliedMinQuantity,
    appliedMaxQuantity,
    appliedGoalFilter,
    transactionGoals,
  ]);

  const sliderMax = useMemo(() => {
    const maxQ =
      transactions && transactions.length > 0
        ? Math.max(...transactions.map((t) => Number(t.quantity) || 0))
        : 0;
    const base = Math.max(200, Math.ceil(maxQ / 20) * 20);
    return Math.max(base, 500);
  }, [transactions]);

  useEffect(() => {
    if (isFilterOpen) {
      setDraftTypeFilter(appliedTypeFilter);

      setDraftMinUnlimited(
        appliedMinQuantity === null || appliedMinQuantity === undefined
      );
      setDraftMaxUnlimited(
        appliedMaxQuantity === null || appliedMaxQuantity === undefined
      );

      setDraftMinQuantity(
        appliedMinQuantity === null || appliedMinQuantity === undefined
          ? 0
          : Number(appliedMinQuantity)
      );

      setDraftMaxQuantity(
        appliedMaxQuantity === null || appliedMaxQuantity === undefined
          ? sliderMax
          : Number(appliedMaxQuantity)
      );

      setDraftGoalFilter(
        appliedGoalFilter === null || appliedGoalFilter === undefined
          ? "all"
          : String(appliedGoalFilter)
      );
    }
  }, [
    isFilterOpen,
    appliedTypeFilter,
    appliedMinQuantity,
    appliedMaxQuantity,
    appliedGoalFilter,
    sliderMax,
  ]);

  useEffect(() => {
    if (draftTypeFilter === null) {
      setDraftGoalFilter("all");
      return;
    }

    const allowedGoals = goals.filter((g) => {
      const gIsTrue = g.type === true || String(g.type) === "true";
      if (draftTypeFilter === "withdraw") return gIsTrue;
      if (draftTypeFilter === "deposit") return !gIsTrue;
      return true;
    });

    if (allowedGoals.length === 0) {
      setDraftGoalFilter("none");
      return;
    }

    if (
      draftGoalFilter === "all" ||
      !allowedGoals.some((g) => String(g.id) === String(draftGoalFilter))
    ) {
      setDraftGoalFilter(String(allowedGoals[0].id));
    }
  }, [draftTypeFilter, draftGoalFilter, goals]);

  const openFilters = () => {
    setDraftTypeFilter(appliedTypeFilter);

    setDraftMinUnlimited(
      appliedMinQuantity === null || appliedMinQuantity === undefined
    );
    setDraftMaxUnlimited(
      appliedMaxQuantity === null || appliedMaxQuantity === undefined
    );

    setDraftMinQuantity(
      appliedMinQuantity === null || appliedMinQuantity === undefined
        ? 0
        : Number(appliedMinQuantity)
    );

    setDraftMaxQuantity(
      appliedMaxQuantity === null || appliedMaxQuantity === undefined
        ? sliderMax
        : Number(appliedMaxQuantity)
    );

    setDraftGoalFilter(
      appliedGoalFilter === null || appliedGoalFilter === undefined
        ? "all"
        : String(appliedGoalFilter)
    );

    setIsFilterOpen(true);
  };

  const handleApply = () => {
    let min = draftMinUnlimited ? null : draftMinQuantity;
    let max = draftMaxUnlimited ? null : draftMaxQuantity;

    if (min !== null && max !== null && min > max) {
      const tmp = min;
      min = max;
      max = tmp;
    }

    setAppliedTypeFilter(draftTypeFilter ?? null);
    setAppliedMinQuantity(min !== null ? Number(min) : null);
    setAppliedMaxQuantity(max !== null ? Number(max) : null);

    setAppliedGoalFilter(
      draftTypeFilter === null
        ? null
        : draftGoalFilter === "all" || draftGoalFilter === "none"
        ? null
        : Number(draftGoalFilter)
    );

    setIsFilterOpen(false);
  };

  const handleClearDrafts = () => {
    setDraftTypeFilter(null);
    setDraftMinUnlimited(true);
    setDraftMaxUnlimited(true);
    setDraftMinQuantity(0);
    setDraftMaxQuantity(sliderMax);
    setDraftGoalFilter("all");
  };

  useEffect(() => {
    if (draftMaxQuantity > sliderMax) setDraftMaxQuantity(sliderMax);
    if (draftMinQuantity > sliderMax) setDraftMinQuantity(sliderMax);
  }, [sliderMax]);

  const goalOptionsForDraft = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    if (draftTypeFilter === null) return [];
    return goals.filter((g) => {
      const gIsTrue = g.type === true || String(g.type) === "true";
      if (draftTypeFilter === "withdraw") return gIsTrue;
      if (draftTypeFilter === "deposit") return !gIsTrue;
      return true;
    });
  }, [goals, draftTypeFilter]);

  const handleCreated = (createdTransaction, createdTG) => {
    if (!createdTransaction) return;
    setTransactions((ts) => {
      const exists = ts.some(
        (t) => Number(t.id) === Number(createdTransaction.id)
      );
      if (exists) return ts;
      return [...ts, createdTransaction];
    });
    if (createdTG) {
      setTransactionGoals((tg) => [...tg, createdTG]);
    }
  };

  if (loading) return <p>Loading user data</p>;

  return (
    <div className="w-full h-[60vh] min-h-0 bg-white rounded-xl shadow-lg p-4 flex flex-col mb-4">
      <CreateContributionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        userId={userId}
        goals={goals}
        onCreated={handleCreated}
      />

      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 pt-1">
            Contributions History
          </h3>
          <span className="text-sm text-slate-500">
            {filteredTransactions.length} item(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCreateOpen(true)}
            title="Create contribution"
            className="p-1 rounded-md bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center"
          >
            <Plus />
          </button>

          <button
            onClick={openFilters}
            title="Open filters"
            className={
              isFilterApplied
                ? "px-2 py-1 rounded-md text-sm font-semibold transition-colors bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "px-2 py-1 rounded-md text-sm font-semibold transition-colors text-gray-700 hover:bg-gray-100"
            }
          >
            <Funnel size={16} />
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Filters</h3>

              <div className="flex gap-2">
                <button
                  onClick={handleClearDrafts}
                  title="Clear all filters"
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <FunnelX size={20} />
                </button>

                <button
                  onClick={() => setIsFilterOpen(false)}
                  title="Close"
                  className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Quantity range
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="minUnlimited"
                      type="checkbox"
                      checked={draftMinUnlimited}
                      onChange={(e) => setDraftMinUnlimited(e.target.checked)}
                    />
                    <label htmlFor="minUnlimited" className="text-sm">
                      No min
                    </label>
                  </div>

                  <div className="text-sm font-medium">
                    Min: {draftMinUnlimited ? "—" : `${draftMinQuantity} €`}
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={20}
                  value={draftMinQuantity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!draftMaxUnlimited && v > draftMaxQuantity) {
                      setDraftMinQuantity(draftMaxQuantity);
                    } else {
                      setDraftMinQuantity(v);
                    }
                  }}
                  disabled={draftMinUnlimited}
                  className="w-full"
                />

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      id="maxUnlimited"
                      type="checkbox"
                      checked={draftMaxUnlimited}
                      onChange={(e) => setDraftMaxUnlimited(e.target.checked)}
                    />
                    <label htmlFor="maxUnlimited" className="text-sm">
                      No max
                    </label>
                  </div>

                  <div className="text-sm font-medium">
                    Max: {draftMaxUnlimited ? "—" : `${draftMaxQuantity} €`}
                  </div>
                </div>

                <input
                  type="range"
                  min={0}
                  max={sliderMax}
                  step={20}
                  value={draftMaxQuantity}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!draftMinUnlimited && v < draftMinQuantity) {
                      setDraftMaxQuantity(draftMinQuantity);
                    } else {
                      setDraftMaxQuantity(v);
                    }
                  }}
                  disabled={draftMaxUnlimited}
                  className="w-full"
                />
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Type</div>

              <div className="flex gap-1 items-center">
                <FilterButton
                  active={draftTypeFilter === null}
                  onClick={() => setDraftTypeFilter(null)}
                  title="All"
                >
                  All
                </FilterButton>

                <FilterButton
                  active={draftTypeFilter === "deposit"}
                  onClick={() => setDraftTypeFilter("deposit")}
                  title="Deposits"
                >
                  Deposit
                </FilterButton>

                <FilterButton
                  active={draftTypeFilter === "withdraw"}
                  onClick={() => setDraftTypeFilter("withdraw")}
                  title="Withdrawals"
                >
                  Withdrawal
                </FilterButton>
              </div>
            </div>

            <div className="border-t my-4" />
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-600 mb-2">Goal</div>

              <div className="flex items-center gap-2">
                <select
                  className="p-2 rounded-md border w-full"
                  value={draftGoalFilter}
                  onChange={(e) => setDraftGoalFilter(e.target.value)}
                  disabled={draftTypeFilter === null}
                >
                  {draftTypeFilter === null && (
                    <option value="all">All goals</option>
                  )}

                  {draftGoalFilter === "none" ? (
                    <option value="none" disabled>
                      No goals available
                    </option>
                  ) : (
                    goalOptionsForDraft.map((g) => (
                      <option key={g.id} value={String(g.id)}>
                        {g.name ?? `Goal ${g.id}`}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-3 py-1 rounded-md text-sm font-medium border"
              >
                Cancel
              </button>

              <button
                onClick={handleApply}
                disabled={draftGoalFilter === "none"}
                className={`px-3 py-1 rounded-md text-sm font-semibold ${
                  draftGoalFilter === "none"
                    ? "bg-gray-300 text-gray-600"
                    : "bg-blue-600 text-white"
                }`}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full space-y-3 p-1 mt-4 overflow-y-auto flex-1 ">
        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-slate-500">
            No contributions for selected filters.
          </p>
        ) : (
          filteredTransactions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((t) => (
              <div key={t.id} className="w-full">
                <ContributionCard
                  transaction={t}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              </div>
            ))
        )}
      </div>
    </div>
  );
}
