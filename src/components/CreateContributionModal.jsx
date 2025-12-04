"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { showError, showSuccess } from "@/app/utils/Toast";

const DEPOSIT_CATEGORY = 10;
const WITHDRAW_CATEGORY = 11;

export default function CreateContributionModal({
  open,
  onClose,
  userId,
  goals = [],
  onCreated,
}) {
  const [transactionType, setTransactionType] = useState("deposit");
  const [goalId, setGoalId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setTransactionType("deposit");
      setGoalId("");
      setQuantity("");
      setDate(new Date().toISOString().split("T")[0]);
      setLoading(false);
    }
  }, [open]);

  const allowedGoals = useMemo(() => {
    if (!goals || goals.length === 0) return [];
    return goals.filter((g) => {
      const gIsTrue = g.type === true || String(g.type) === "true";
      const gCompleted = g.completed === true || String(g.completed) === "true";
      if (gCompleted) return false;

      if (transactionType === "withdrawal") return gIsTrue;
      return !gIsTrue;
    });
  }, [goals, transactionType]);

  useEffect(() => {
    if (allowedGoals.length === 0) {
      setGoalId("");
    } else {
      if (!allowedGoals.some((g) => String(g.id) === String(goalId))) {
        setGoalId(String(allowedGoals[0].id));
      }
    }
  }, [allowedGoals]);

  const validQuantity = () => {
    const n = parseFloat(quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validQuantity()) {
      showError("Please enter a valid quantity (number > 0)");
      return;
    }

    if (!goalId) {
      showError("Please choose a goal to contribute to");
      return;
    }

    setLoading(true);

    const payload = {
      type: true,
      quantity: quantity,
      category:
        transactionType === "deposit" ? DEPOSIT_CATEGORY : WITHDRAW_CATEGORY,
      created_at: date,
    };

    const baseUrl = process.env.CREATE_TRANSACTION;
    const goalQuery = goalId ? `&goalId=${goalId}` : "";
    const url = baseUrl
      ? `${baseUrl}?userId=${userId}${goalQuery}`
      : `http://localhost:5050/api/transactions/create/?userId=${userId}${goalQuery}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      const data = await res.json();
      showSuccess("Contribution created successfully!");
      setLoading(false);
      onClose();
      const created = data.transaction ?? data;
      if (onCreated) onCreated(created, data.transactionGoal ?? null);
    } catch (err) {
      showError(err.message || "Unexpected error");
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-2">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Add contribution
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Type</div>
            <div className="flex gap-6">
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={transactionType === "deposit"}
                  onChange={() => {
                    setTransactionType("deposit");
                  }}
                />
                Deposit
              </label>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="type"
                  checked={transactionType === "withdrawal"}
                  onChange={() => {
                    setTransactionType("withdrawal");
                  }}
                />
                Withdrawal
              </label>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">Goal</div>

            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full p-2 border rounded"
              required
            >
              {allowedGoals.length === 0 ? (
                <option value="">No goals available</option>
              ) : (
                allowedGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name ?? `Goal ${g.id}`}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Quantity
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                required
              />
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">Date</div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border rounded text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setTransactionType("deposit");
                setGoalId("");
                setQuantity("");
                setDate(new Date().toISOString().split("T")[0]);
              }}
              className="px-3 py-1 rounded-md text-sm font-medium border text-gray-700"
            >
              Reset
            </button>

            <button
              type="submit"
              disabled={loading || !goalId}
              className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
