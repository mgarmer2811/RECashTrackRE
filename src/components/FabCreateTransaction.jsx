"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { CATEGORY_MAP } from "@/app/utils/Utils";
import { showError, showSuccess } from "@/app/utils/Toast";

export default function FabCreateTransaction({ userId }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  const expenseOptions = [1, 2, 3, 4, 5, 6, 7, 8];
  const savingCategory = 9;

  const resetForm = () => {
    setCategory("");
    setQuantity("");
    setDate(new Date().toISOString().split("T")[0]);
    setLoading(false);
  };

  const validQuantity = () => {
    const n = parseFloat(quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const validCategory = () => {
    if (Number(category) > 0 && Number(category) < 10) return true;
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validCategory()) {
      showError("Please choose a valid category");
      return;
    }
    if (!validQuantity()) {
      showError("Please enter a valid quantity (number > 0)");
      return;
    }

    setLoading(true);

    const payload = {
      type: false,
      quantity: quantity,
      category: isExpense ? Number(category) : savingCategory,
      created_at: date,
    };

    const baseUrl = process.env.NEXT_PUBLIC_CREATE_TRANSACTION;
    const url = baseUrl
      ? `${baseUrl}?userId=${userId}`
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
        <Plus size={30} color="white" />
      </button>

      {open && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 p-2">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-xl mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">
                Add operation
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
                      name="type"
                      checked={isExpense === true}
                      onChange={() => {
                        setIsExpense(true);
                        setCategory("");
                      }}
                    />
                    Expense
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="type"
                      checked={isExpense === false}
                      onChange={() => {
                        setIsExpense(false);
                        setCategory(savingCategory);
                      }}
                    />
                    Saving
                  </label>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-600 mb-2">
                  Category
                </div>

                {isExpense ? (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    required
                  >
                    <option value="">-- Select category --</option>
                    {expenseOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_MAP?.[cat]?.name ?? `Category ${cat}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 border rounded text-sm text-gray-700">
                    Saving
                  </div>
                )}
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
                  <div className="text-sm font-medium text-gray-600 mb-2">
                    Date
                  </div>
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
