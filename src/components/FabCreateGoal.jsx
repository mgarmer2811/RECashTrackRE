"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { showError, showSuccess } from "@/app/utils/Toast";

export default function FabCreateGoal({ userId }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setType(true);
    setQuantity("");
    setName("");
    setLoading(false);
  };

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
      showError("Please enter a valid name for the goal");
      return;
    }

    if (!validQuantity()) {
      showError("Please enter a valid quantity (number > 0)");
      return;
    }

    setLoading(true);

    const payload = {
      type: Boolean(type),
      quantity: parseFloat(quantity),
      name: name.trim(),
      created_at: new Date().toISOString().split("T")[0],
      completed: false,
    };

    const baseUrl = process.env.CREATE_GOAL;
    const url = baseUrl
      ? `${baseUrl}?userId=${userId}`
      : `http://localhost:5050/api/goals/create?userId=${userId}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to create goal");
      }

      showSuccess("Goal created successfully!");
      resetForm();
      setOpen(false);
    } catch (err) {
      showError(err.message || "Unexpected error");
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-6 z-40 p-4 rounded-xl shadow-lg bg-blue-700 hover:bg-blue-800 focus:outline-none"
      >
        <Plus size={20} color="white" />
      </button>

      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-2">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Create goal
              </h3>

              <button
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Type
                </div>
                <div className="flex gap-6">
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="goal-type"
                      checked={type === true}
                      onChange={() => setType(true)}
                    />
                    Budget
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="goal-type"
                      checked={type === false}
                      onChange={() => setType(false)}
                    />
                    Saving
                  </label>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Name
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                  required
                />
              </div>

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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => resetForm()}
                  className="px-3 py-1 rounded-md text-sm font-medium border text-gray-700"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
