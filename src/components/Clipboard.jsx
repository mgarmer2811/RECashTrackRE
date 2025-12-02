"use client";

import { useEffect, useState } from "react";
import { CATEGORY_MAP } from "../app/utils/Utils";
import { showError, showSuccess } from "@/app/utils/Toast";

export default function Clipboard({ userId }) {
  const [isExpense, setIsExpense] = useState(true);
  const [contributeToGoal, setContributeToGoal] = useState(false);
  const [goals, setGoals] = useState([]);
  const [goalId, setGoalId] = useState(0);
  const [category, setCategory] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const fetchGoals = async () => {
      let url = `http://localhost:5050/api/goals/get?userId=${userId}`;

      try {
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
        setGoals(data.goals);
      } catch (error) {
        if (signal.aborted) {
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.error(error);
        }
        showError("Unexpected error. Could not load goals");
      }
    };

    fetchGoals();

    return () => {
      controller.abort();
    };
  }, [userId]);

  useEffect(() => {
    if (!isExpense) {
      setCategory(9);
    }
  }, [isExpense]);

  const validQuantity = () => {
    const n = parseFloat(quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const validCategory = () => {
    return category > 0 && category < 10;
  };

  const reset = () => {
    setQuantity("");
    setContributeToGoal(false);
    setGoalId(-1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validCategory()) {
      showError("Please choose a category for the operation");
      return;
    }

    if (!validQuantity()) {
      showError("Please enter a valid quantity (number > 0)");
      return;
    }

    const payload = {
      type: isExpense,
      quantity: quantity,
      category: category,
      created_at: date,
    };

    let url = contributeToGoal
      ? `http://localhost:5050/api/transactions/create/?goalId=${goalId}&userId=${userId}`
      : `http://localhost:5050/api/transactions/create/?userId=${userId}`;

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

      showSuccess("Transaction created successfully!");
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="max-w-lg p-4 bg-white rounded shadow"
      >
        <h2 className="text-xl font-semibold mb-4">Create transaction</h2>
        <div className="mb-4">
          <label className="block font-medium mb-1">Type</label>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                checked={isExpense === true}
                onChange={() => setIsExpense(true)}
                className="mr-2"
              />
              Expense
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="type"
                checked={isExpense === false}
                onChange={() => setIsExpense(false)}
                className="mr-2"
              />
              Saving
            </label>
          </div>
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Category</label>
          {isExpense ? (
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">-- Select category --</option>
              {Object.entries(CATEGORY_MAP)
                .filter(([id]) => Number(id) !== 9)
                .map(([id, c]) => (
                  <option key={id} value={id}>
                    {c.name}
                  </option>
                ))}
            </select>
          ) : (
            <div className="p-2 border rounded">Saving</div>
          )}
        </div>

        <div className="mb-4">
          <label className="block font-medium mb-1">Contribute to goal?</label>
          <div className="flex gap-4 items-center mb-2">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="contribute"
                checked={contributeToGoal === true}
                onChange={() => setContributeToGoal(true)}
                className="mr-2"
              />
              Yes
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="contribute"
                checked={contributeToGoal === false}
                onChange={() => setContributeToGoal(false)}
                className="mr-2"
              />
              No
            </label>
          </div>

          <div>
            <label className="block font-medium mb-1">Choose goal</label>
            {contributeToGoal && (
              <select
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!contributeToGoal}
                required={contributeToGoal}
              >
                <option value="">-- Select goal --</option>
                {goals
                  .filter((g) => g.type == isExpense)
                  .map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block font-medium mb-1">Quantity</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
          >
            {loading ? "Saving..." : "Create"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 rounded bg-gray-200"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
