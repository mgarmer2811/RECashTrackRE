import { useState } from "react";
import { X, Trash2 } from "lucide-react";
import { showError, showSuccess } from "@/app/utils/Toast";

export default function ContributionModal({
  transaction,
  onClose,
  onUpdate,
  onDelete,
}) {
  const [quantity, setQuantity] = useState(String(transaction.quantity ?? "0"));
  const [loading, setLoading] = useState(false);

  const validQuantity = () => {
    const n = parseFloat(quantity);
    return !Number.isNaN(n) && isFinite(n) && n > 0;
  };

  const handleSave = async () => {
    if (!validQuantity()) {
      alert("Please enter a valid quantity.");
      return;
    }

    const payload = {
      quantity: Number(parseFloat(quantity) || 0),
    };

    setLoading(true);
    try {
      await onUpdate(transaction.id, payload);
      showSuccess("Updated contribution successfully!");
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error(err?.message ?? err);
      showError("Unexpected error. Could not update contribution");
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
      await onDelete(transaction.id);
      showSuccess("Deleted contribution successfully!");
      onClose();
    } catch (err) {
      if (process.env.NODE_ENV === "development")
        console.error(err?.message ?? err);
      showError("Unexpected error. Could not delete contribution");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md mx-2 md:mx-0 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Edit contribution
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
            aria-label="Close"
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
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full border px-3 py-2 rounded-md text-sm"
              inputMode="decimal"
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
              onClick={handleSave}
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
