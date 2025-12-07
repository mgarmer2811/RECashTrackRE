"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { io } from "socket.io-client";
import { showError } from "@/app/utils/Toast";
import TransactionCard from "./TransactionCard";
import { Pencil, FunnelX, X, Funnel } from "lucide-react";
import { CATEGORY_MAP } from "@/app/utils/Utils";

const ALLOWED_CATEGORIES = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const EXPENSE_CATEGORIES = [1, 2, 3, 4, 5, 6, 7, 8];
const SAVING_CATEGORY = 9;

function parseDateOnly(value) {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

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

export default function TransactionRenderer({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [appliedTimeFilter, setAppliedTimeFilter] = useState("all");
  const [appliedCustomStart, setAppliedCustomStart] = useState("");
  const [appliedCustomEnd, setAppliedCustomEnd] = useState("");
  const [appliedTypeFilter, setAppliedTypeFilter] = useState("all");
  const [appliedSelectedCategory, setAppliedSelectedCategory] = useState(null);
  const [appliedMinQuantity, setAppliedMinQuantity] = useState(null);
  const [appliedMaxQuantity, setAppliedMaxQuantity] = useState(null);

  const [draftTimeFilter, setDraftTimeFilter] = useState(appliedTimeFilter);
  const [draftCustomStart, setDraftCustomStart] = useState(appliedCustomStart);
  const [draftCustomEnd, setDraftCustomEnd] = useState(appliedCustomEnd);
  const [draftTypeFilter, setDraftTypeFilter] = useState(appliedTypeFilter);
  const [draftSelectedCategory, setDraftSelectedCategory] = useState(
    appliedSelectedCategory
  );

  const [draftMinQuantity, setDraftMinQuantity] = useState(0);
  const [draftMaxQuantity, setDraftMaxQuantity] = useState(500);
  const [draftMinUnlimited, setDraftMinUnlimited] = useState(true);
  const [draftMaxUnlimited, setDraftMaxUnlimited] = useState(true);

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
        const baseUrl = process.env.NEXT_PUBLIC_GET_TRANSACTIONS;
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
          setTransactions(data.transactions ?? []);
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

    const socket = io("https://rct-api-iia5.onrender.com");
    socketRef.current = socket;

    socket.on("connect", () => {
      if (process.env.NODE_ENV === "development")
        console.log("Socket connected", socket.id);
      socket.emit("join", { userId });
    });

    socket.on("transaction:created", (payload) => {
      const { transaction } = payload || {};
      if (!transaction) return;

      setTransactions((ts) => {
        const exists = ts.some((t) => t.id === transaction.id);
        if (exists) return ts;
        return [...ts, transaction];
      });
    });

    socket.on("transaction:updated", (payload) => {
      const { transaction } = payload || {};
      if (!transaction) return;
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

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development")
        console.warn("Socket disconnected. Reason: ", reason);
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
    const baseUrl = process.env.NEXT_PUBLIC_UPDATE_TRANSACTION;
    const url = baseUrl
      ? `${baseUrl}${transactionId}?userId=${userId}`
      : `http://localhost:5050/api/transactions/update/${transactionId}?userId=${userId}`;
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
      return await res.json();
    } catch (err) {
      throw err;
    }
  };

  const onDelete = async (transactionId) => {
    const baseUrl = process.env.NEXT_PUBLIC_DELETE_TRANSACTION;
    const url = baseUrl
      ? `${baseUrl}${transactionId}?userId=${userId}`
      : `http://localhost:5050/api/transactions/delete/${transactionId}?userId=${userId}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
      return true;
    } catch (err) {
      throw err;
    }
  };

  const isFilterApplied = useMemo(() => {
    const noCustomDates = !appliedCustomStart && !appliedCustomEnd;
    const noSelectedCategory =
      appliedSelectedCategory === null || appliedSelectedCategory === undefined;
    const noQuantityLimits =
      (appliedMinQuantity === null || appliedMinQuantity === undefined) &&
      (appliedMaxQuantity === null || appliedMaxQuantity === undefined);
    return !(
      appliedTimeFilter === "all" &&
      noCustomDates &&
      appliedTypeFilter === "all" &&
      noSelectedCategory &&
      noQuantityLimits
    );
  }, [
    appliedTimeFilter,
    appliedCustomStart,
    appliedCustomEnd,
    appliedTypeFilter,
    appliedSelectedCategory,
    appliedMinQuantity,
    appliedMaxQuantity,
  ]);

  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (appliedTimeFilter === "1week") {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      endDate = now;
    } else if (appliedTimeFilter === "1month") {
      startDate = new Date(now);
      startDate.setMonth(now.getMonth() - 1);
      endDate = now;
    } else if (appliedTimeFilter === "1year") {
      startDate = new Date(now);
      startDate.setFullYear(now.getFullYear() - 1);
      endDate = now;
    } else if (appliedTimeFilter === "custom") {
      const s = parseDateOnly(appliedCustomStart);
      const e = parseDateOnly(appliedCustomEnd);
      if (s) startDate = new Date(s.setHours(0, 0, 0, 0));
      if (e) endDate = new Date(e.setHours(23, 59, 59, 999));
    } else if (appliedTimeFilter === "all") {
      startDate = null;
      endDate = null;
    }

    return transactions
      .filter((t) => {
        const cat = Number(t.category);
        return ALLOWED_CATEGORIES.includes(cat);
      })
      .filter((t) => {
        const d = new Date(t.created_at);
        if (startDate && d < startDate) return false;
        if (endDate && d > endDate) return false;

        if (appliedTypeFilter === "expense") {
          if (!EXPENSE_CATEGORIES.includes(Number(t.category))) return false;
          if (
            appliedSelectedCategory &&
            Number(appliedSelectedCategory) !== Number(t.category)
          )
            return false;
        } else if (appliedTypeFilter === "saving") {
          if (Number(t.category) !== SAVING_CATEGORY) return false;
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
    appliedTimeFilter,
    appliedCustomStart,
    appliedCustomEnd,
    appliedTypeFilter,
    appliedSelectedCategory,
    appliedMinQuantity,
    appliedMaxQuantity,
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
      setDraftTimeFilter(appliedTimeFilter);
      setDraftCustomStart(appliedCustomStart);
      setDraftCustomEnd(appliedCustomEnd);
      setDraftTypeFilter(appliedTypeFilter);
      setDraftSelectedCategory(appliedSelectedCategory);

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
    }
  }, [
    isFilterOpen,
    appliedTimeFilter,
    appliedCustomStart,
    appliedCustomEnd,
    appliedTypeFilter,
    appliedSelectedCategory,
    appliedMinQuantity,
    appliedMaxQuantity,
    sliderMax,
  ]);

  const openFilters = () => {
    setDraftTimeFilter(appliedTimeFilter);
    setDraftCustomStart(appliedCustomStart);
    setDraftCustomEnd(appliedCustomEnd);
    setDraftTypeFilter(appliedTypeFilter);
    setDraftSelectedCategory(appliedSelectedCategory);

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

    setAppliedTimeFilter(draftTimeFilter ?? "all");
    setAppliedCustomStart(draftCustomStart ?? "");
    setAppliedCustomEnd(draftCustomEnd ?? "");
    setAppliedTypeFilter(draftTypeFilter ?? "all");

    if (draftTypeFilter === "saving") {
      setAppliedSelectedCategory(SAVING_CATEGORY);
    } else if (draftTypeFilter === "expense") {
      setAppliedSelectedCategory(
        draftSelectedCategory ? Number(draftSelectedCategory) : null
      );
    } else {
      setAppliedSelectedCategory(null);
    }

    setAppliedMinQuantity(min !== null ? Number(min) : null);
    setAppliedMaxQuantity(max !== null ? Number(max) : null);

    setIsFilterOpen(false);
  };

  const handleClearDrafts = () => {
    setDraftTimeFilter("all");
    setDraftCustomStart("");
    setDraftCustomEnd("");
    setDraftTypeFilter("all");
    setDraftSelectedCategory(null);

    setDraftMinUnlimited(true);
    setDraftMaxUnlimited(true);
    setDraftMinQuantity(0);
    setDraftMaxQuantity(sliderMax);
  };

  useEffect(() => {
    if (draftTypeFilter === "all") {
      setDraftSelectedCategory(null);
    } else if (draftTypeFilter === "saving") {
      setDraftSelectedCategory(SAVING_CATEGORY);
    } else if (draftTypeFilter === "expense") {
      const expenseOptions = EXPENSE_CATEGORIES;
      if (!expenseOptions.includes(Number(draftSelectedCategory))) {
        setDraftSelectedCategory(null);
      }
    }
  }, [draftTypeFilter]);
  useEffect(() => {
    if (draftMaxQuantity > sliderMax) setDraftMaxQuantity(sliderMax);
    if (draftMinQuantity > sliderMax) setDraftMinQuantity(sliderMax);
  }, [sliderMax]);

  if (loading) return <p>Loading user data</p>;

  return (
    <div className="w-full h-[60vh] min-h-0 bg-white rounded-xl shadow-lg p-4 flex flex-col mb-4">
      <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 pt-1">
            Operations History
          </h3>
          <span className="text-sm text-slate-500">
            {filteredTransactions.length} item(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
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
                Date range
              </div>

              <div className="flex gap-1">
                {[
                  { key: "1week", label: "1W" },
                  { key: "1month", label: "1M" },
                  { key: "1year", label: "1Y" },
                  { key: "custom", label: "custom" },
                ].map((r) => {
                  const isActive = draftTimeFilter === r.key;
                  return (
                    <FilterButton
                      key={r.key}
                      active={isActive}
                      onClick={() => setDraftTimeFilter(r.key)}
                      title={r.key === "custom" ? "Custom" : r.label}
                    >
                      {r.key === "custom" ? <Pencil size={14} /> : r.label}
                    </FilterButton>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <input
                  type="date"
                  value={draftCustomStart}
                  onChange={(e) => setDraftCustomStart(e.target.value)}
                  className="w-36 px-2 py-1 border rounded"
                  disabled={draftTimeFilter !== "custom"}
                />
                <span className="text-sm text-slate-500">—</span>
                <input
                  type="date"
                  value={draftCustomEnd}
                  onChange={(e) => setDraftCustomEnd(e.target.value)}
                  className="w-36 px-2 py-1 border rounded"
                  disabled={draftTimeFilter !== "custom"}
                />
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
                  active={draftTypeFilter === "all"}
                  onClick={() => setDraftTypeFilter("all")}
                  title="All"
                >
                  All
                </FilterButton>

                <FilterButton
                  active={draftTypeFilter === "expense"}
                  onClick={() => setDraftTypeFilter("expense")}
                  title="Expenses"
                >
                  Expense
                </FilterButton>

                <FilterButton
                  active={draftTypeFilter === "saving"}
                  onClick={() => setDraftTypeFilter("saving")}
                  title="Savings"
                >
                  Saving
                </FilterButton>
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="mb-2">
              <div className="text-sm font-medium text-gray-600 mb-2">
                Category
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={draftSelectedCategory ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDraftSelectedCategory(v ? Number(v) : null);
                  }}
                  className="px-2 py-1 border rounded text-sm"
                  disabled={
                    draftTypeFilter === "all" || draftTypeFilter === "saving"
                  }
                >
                  {draftTypeFilter === "all" && (
                    <option value="">All categories</option>
                  )}

                  {draftTypeFilter === "expense" && (
                    <>
                      <option value="">All expenses</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_MAP?.[cat]?.name ?? `Category ${cat}`}
                        </option>
                      ))}
                    </>
                  )}

                  {draftTypeFilter === "saving" && (
                    <>
                      <option value={SAVING_CATEGORY}>
                        {CATEGORY_MAP?.[SAVING_CATEGORY]?.name ?? `Saving`}
                      </option>
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="border-t my-4" />

            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                onClick={() => setIsFilterOpen(false)}
                className="px-3 py-1 rounded-md text-sm font-medium border"
              >
                Cancel
              </button>

              <button
                onClick={handleApply}
                className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white"
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
            No transactions for selected filters.
          </p>
        ) : (
          filteredTransactions
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .map((t) => (
              <div key={t.id} className="w-full">
                <TransactionCard
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
