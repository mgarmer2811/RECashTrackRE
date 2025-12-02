"use client";

import { useEffect, useState } from "react";
import { Trash2, X } from "lucide-react";
import { showSuccess, showError } from "@/app/utils/Toast";
import { CATEGORY_MAP } from "@/app/utils/Utils";

export default function TransactionModal({
  transaction,
  onClose,
  onUpdate,
  onDelete,
}) {
  const initialCategory = Number(transaction.category ?? 8);
  const initialType = initialCategory === 9 ? "saving" : "expense";

  const [local, setLocal] = useState({
    quantity: String(transaction.quantity ?? "0"),
    category: String(initialCategory),
    type: initialType,
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocal((l) => {
      if (l.type === "saving" && l.category !== "9")
        return { ...l, category: "9" };
      if (l.type === "expense" && l.category === "9")
        return { ...l, category: "8" };
      return l;
    });
  }, [local.type]);

  const validQuantity = () => {
    const n = parseFloat(local.quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const handleUpdate = async () => {
    if (!validQuantity()) {
      alert("Please enter a valid quantity.");
      return;
    }

    const payload = {
      quantity: Number(parseFloat(local.quantity) || 0),
      category: Number(local.category),
      type: false,
    };

    setLoading(true);
    try {
      await onUpdate(transaction.id, payload);
      showSuccess("Updated transaction successfully!");
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error(err?.message ?? err);
      showError("Unexpected error. Could not update transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this? This action cannot be undone."
    );
    if (confirmDelete) {
      setLoading(true);
      try {
        await onDelete(transaction.id);
        showSuccess("Deleted transaction successfully!");
        onClose();
      } catch (err) {
        if (process.env.NODE_ENV === "development")
          console.error(err?.message ?? err);
        showError("Unexpected error. Could not delete transaction");
      } finally {
        setLoading(false);
      }
    }
  };

  const expenseCategories = Object.entries(CATEGORY_MAP).filter(
    ([k]) => Number(k) >= 1 && Number(k) <= 8
  );
  const savingCategory = [["9", CATEGORY_MAP[9]]];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 md:mx-0 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Edit operation
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="block text-gray-600 font-medium mb-1">
              Quantity
            </label>
            <input
              value={local.quantity}
              onChange={(e) =>
                setLocal((l) => ({ ...l, quantity: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded-md text-sm"
              inputMode="decimal"
              disabled={loading}
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-gray-600 font-medium mb-1">
                Type
              </label>
              <select
                value={local.type}
                onChange={(e) =>
                  setLocal((l) => ({ ...l, type: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-md text-sm"
                disabled={loading}
              >
                <option value="expense">Expense</option>
                <option value="saving">Saving</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="block text-gray-600 font-medium mb-1">
                Category
              </label>
              <select
                value={local.category}
                onChange={(e) =>
                  setLocal((l) => ({ ...l, category: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded-md text-sm"
                disabled={loading || local.type !== "expense"}
              >
                {local.type === "expense"
                  ? expenseCategories.map(([k, v]) => (
                      <option key={k} value={k}>{`${v.name}`}</option>
                    ))
                  : savingCategory.map(([k, v]) => (
                      <option key={k} value={k}>{`${v.name}`}</option>
                    ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 mt-6">
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700"
              disabled={loading}
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-md text-sm font-medium border text-gray-700 hover:bg-gray-100"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              className="px-3 py-1 rounded-md text-sm font-semibold bg-blue-600 text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
