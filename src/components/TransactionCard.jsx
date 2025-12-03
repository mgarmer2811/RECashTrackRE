import { useState } from "react";
import { Pencil } from "lucide-react";
import TransactionModal from "./TransactionModal";
import { CATEGORY_MAP, formatEuro } from "@/app/utils/Utils";

import {
  House,
  Apple,
  CarFront,
  Rss,
  HeartPlus,
  Clapperboard,
  GraduationCap,
  PackageOpen,
  BanknoteArrowUp,
  ShieldBan,
  Flame,
} from "lucide-react";

const ICON_MAP = {
  1: House,
  2: Apple,
  3: CarFront,
  4: Rss,
  5: HeartPlus,
  6: Clapperboard,
  7: GraduationCap,
  8: PackageOpen,
  9: BanknoteArrowUp,
  10: ShieldBan,
  11: Flame,
};

export default function TransactionCard({ transaction, onUpdate, onDelete }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const category = Number(transaction.category) || 8;
  const cat = CATEGORY_MAP[category] || CATEGORY_MAP[8];
  const Icon = ICON_MAP[category] || ICON_MAP[8];

  const amount = Number(transaction.quantity) || 0;

  const isExpense = (category >= 1 && category <= 8) || category === 11;
  const sign = isExpense ? "-" : "+";
  const colorClass = isExpense ? "text-red-600" : "text-blue-600";
  const amountFormatted = `€${formatEuro(Math.abs(amount))}`;

  return (
    <>
      <div className="relative bg-white shadow shadow-lg rounded-xl p-4 w-full border border-gray-300">
        <div className="absolute top-3 right-3">
          <button
            onClick={openModal}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            aria-label="Edit transaction"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-md"
            style={{
              background: `${cat.color}22`,
              border: `1px solid ${cat.color}`,
            }}
          >
            <Icon size={20} style={{ color: cat.color }} />
          </div>

          <div className="flex-1">
            <div className="flex items-baseline justify-between pr-10">
              <h4 className="text-sm font-medium text-gray-700">{cat.name}</h4>

              <span className="text-xs text-slate-500">
                {new Date(transaction.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className={`font-mono text-sm ${colorClass}`}>
                {sign}
                {amountFormatted}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TransactionModal
          transaction={transaction}
          onClose={closeModal}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
