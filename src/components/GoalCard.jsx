import { useState } from "react";
import { Flame, ShieldBan, Pencil } from "lucide-react";
import GoalModal from "./GoalModal";
import { formatEuro } from "@/app/utils/Utils";

export default function GoalCard({
  goal,
  current = 0,
  percentDisplayed = 0,
  barPercent = 0,
  remaining = null,
  onUpdate,
  onDelete,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const isBudget = goal.type;

  const displayPercent = Math.max(
    0,
    Math.min(100, Number(percentDisplayed) || 0)
  );
  const barWidth = Math.max(0, Math.min(100, Number(barPercent) || 0));
  const remainingToShow = isBudget
    ? remaining ?? Math.max(0, Number(goal.quantity) - current)
    : null;

  const barColor = isBudget ? "#DC2626" : "#1D4ED8";

  return (
    <>
      <div className="relative bg-white shadow-lg rounded-xl p-4 w-full">
        <div className="absolute top-3 right-3">
          <button
            onClick={openModal}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            aria-label="Edit goal"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-lg border ${
              isBudget ? "border-red-700" : "border-blue-700"
            }`}
          >
            {isBudget ? (
              <Flame className="text-red-700" size={20} />
            ) : (
              <ShieldBan className="text-blue-700" size={20} />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-baseline justify-between pr-10">
              <h4 className="text-sm font-bold">{goal.name.toUpperCase()}</h4>
              <span className="text-xs text-slate-500">
                {new Date(goal.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-2">
                <div className="font-mono">
                  {isBudget
                    ? formatEuro(remainingToShow ?? 0)
                    : formatEuro(current ?? 0)}{" "}
                  / {formatEuro(goal.quantity)}
                </div>
                <div className="font-semibold">
                  {Math.round(displayPercent)}%
                </div>
              </div>

              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <GoalModal
          goal={goal}
          onClose={closeModal}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
