"use client";

import { useState } from "react";
import { showSuccess, showError } from "@/app/utils/Toast";

export default function CreateGoal({ userId }) {
  const [typeIsBudget, setTypeIsBudget] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const validQuantity = () => {
    const n = parseFloat(quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const validName = () => {
    return String(name).trim().length > 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validName()) {
      showError("Please provide a name for the goal.");
      return;
    }

    if (!validQuantity()) {
      showError("Please enter a valid quantity (number > 0).");
      return;
    }

    const payload = {
      type: !!typeIsBudget,
      quantity: Number(parseFloat(quantity) || 0),
      name: name.trim(),
    };

    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_CREATE_GOAL;
      const url = baseUrl
        ? `${baseUrl}?userId=${userId}`
        : `http://localhost:5050/api/goals/create?userId=${userId}`;
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

      showSuccess("Goal created successfully!");
      setName("");
      setQuantity("");
      setTypeIsBudget(true);
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
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md bg-white shadow rounded-md p-4 space-y-4"
    >
      <h3 className="text-lg font-semibold">Create a goal</h3>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Type
        </label>
        <select
          value={typeIsBudget ? "Budget" : "Saving"}
          onChange={(e) => setTypeIsBudget(e.target.value === "Budget")}
          className="w-full border px-2 py-2 rounded-md text-sm"
          disabled={loading}
        >
          <option value="Budget">Budget (spending)</option>
          <option value="Saving">Saving goal</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Quantity / Limit
        </label>
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border px-2 py-2 rounded-md text-sm"
          inputMode="decimal"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border px-2 py-2 rounded-md text-sm"
          disabled={loading}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          className={`px-3 py-2 rounded-md text-white text-sm ${
            loading ? "bg-slate-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loading}
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </form>
  );
}
