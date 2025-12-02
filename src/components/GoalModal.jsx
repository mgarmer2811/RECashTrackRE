import { showError, showSuccess } from "@/app/utils/Toast";
import { useEffect, useRef, useState } from "react";

export default function GoalModal({ goal, onClose, onUpdate, onDelete }) {
  const [local, setLocal] = useState({
    quantity: String(goal.quantity),
    name: goal.name,
    completed: goal.completed,
  });

  const [isDeleting, setIsDeleting] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, loading]);

  const validQuantity = () => {
    const n = parseFloat(local.quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const validName = () => {
    return String(local.name).trim().length > 0;
  };

  const handleUpdate = async () => {
    if (!validQuantity()) {
      alert("Please enter a valid quantity (number ≥ 0).");
      return;
    }

    if (!validName) {
      alert("Please enter a valid quantity (number >= 0");
      return;
    }

    const payload = {
      quantity: Number(parseFloat(local.quantity) || 0),
      name: local.name,
      completed: local.completed,
    };

    setLoading(true);

    try {
      await onUpdate(goal.id, payload);
      showSuccess("Updated goal successfully!");
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error.message);
      }
      showError("Unexpected error. Could not update goal");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      await onDelete(goal.id);
      showSuccess("Deleted goal successfully!");
      onClose();
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(error.message);
      }
      showError("Unexpected error. Could not delete goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
    >
      <div
        ref={modalRef}
        className="w-full max-w-md mx-2 md:mx-0 bg-white rounded-2xl shadow-xl p-4 md:p-6"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold">Edit goal</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 ml-2"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 space-y-2 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Quantity / Limit
            </label>
            <input
              value={local.quantity}
              onChange={(e) =>
                setLocal((local) => ({ ...local, quantity: e.target.value }))
              }
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
              value={local.name}
              onChange={(e) =>
                setLocal((local) => ({ ...local, name: e.target.value }))
              }
              className="w-full border px-2 py-2 rounded-md text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Completed
            </label>
            <select
              value={local.completed ? "true" : "false"}
              onChange={(e) =>
                setLocal((local) => ({
                  ...local,
                  completed: e.target.value === "true",
                }))
              }
              className="w-full border px-2 py-2 rounded-md text-sm"
              disabled={loading}
            >
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => !loading && onClose()}
              className="px-3 py-2 rounded-md border text-sm"
              disabled={loading}
            >
              Cancel
            </button>

            <button
              onClick={handleUpdate}
              className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
          <div className="text-right">
            {!isDeleting ? (
              <button
                onClick={() => setIsDeleting(true)}
                className="px-3 py-2 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                disabled={loading}
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-700 font-medium">
                  Confirm?
                </span>
                <button
                  onClick={handleDelete}
                  className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
                  disabled={loading}
                >
                  {loading ? "Deleting..." : "Yes, delete"}
                </button>
                <button
                  onClick={() => setIsDeleting(false)}
                  className="px-2 py-1 rounded-md border text-sm"
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
