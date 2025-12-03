"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { showSuccess, showError } from "@/app/utils/Toast";

export default function GoalModal({ goal, onClose, onUpdate, onDelete }) {
  const [local, setLocal] = useState({
    quantity: String(goal?.quantity ?? "0"),
    name: goal?.name ?? "",
  });

  const [loading, setLoading] = useState(false);

  const validQuantity = () => {
    const n = parseFloat(local.quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const validName = () => {
    return String(local.name).trim().length > 0;
  };

  const handleUpdate = async () => {
    if (!validQuantity()) {
      alert("Please enter a valid quantity.");
      return;
    }

    if (!validName()) {
      alert("Please enter a valid name.");
      return;
    }

    const payload = {
      quantity: Number(parseFloat(local.quantity) || 0),
      name: local.name,
    };

    setLoading(true);
    try {
      await onUpdate(goal.id, payload);
      showSuccess("Updated goal successfully!");
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error(err?.message ?? err);
      showError("Unexpected error. Could not update goal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this? This action cannot be undone."
    );
    if (!confirmDelete) return;

    setLoading(true);
    try {
      await onDelete(goal.id);
      showSuccess("Deleted goal successfully!");
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error(err?.message ?? err);
      showError("Unexpected error. Could not delete goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 md:mx-0 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Edit goal</h3>
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

          <div>
            <label className="block text-gray-600 font-medium mb-1">Name</label>
            <input
              value={local.name}
              onChange={(e) =>
                setLocal((l) => ({ ...l, name: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded-md text-sm"
              disabled={loading}
            />
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
