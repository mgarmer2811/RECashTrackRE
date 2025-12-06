"use client";

import { useState } from "react";
import { Pencil, ShieldBan, Flame } from "lucide-react";
import { formatEuro } from "@/app/utils/Utils";
import ContributionModal from "./ContributionModal";

export default function FamilyContributionCard({
  transaction,
  onUpdate,
  onDelete,
  creatorName = null,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const category = Number(transaction.category);
  const isDeposit = category === 10;
  const isWithdrawal = category === 11;
  const isDepositFallback = isDeposit || (!isDeposit && !isWithdrawal);

  const color = isDepositFallback ? "#1D4ED8" : "#DC2626";
  const Icon = isDepositFallback ? ShieldBan : Flame;

  const amount = Number(transaction.quantity) || 0;
  const sign = isWithdrawal ? "-" : "+";
  const amountFormatted = `€${formatEuro(Math.abs(amount))}`;

  const colorClass = isWithdrawal ? "text-red-600" : "text-blue-600";

  return (
    <>
      <div className="relative bg-white shadow shadow-lg rounded-xl p-4 w-full border border-gray-300">
        <div className="absolute top-3 right-3">
          <button
            onClick={openModal}
            className="p-2 text-gray-700 hover:bg-gray-100 rounded-md"
            aria-label="Edit contribution"
          >
            <Pencil size={16} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="p-3 rounded-md"
            style={{
              background: `${color}22`,
              border: `1px solid ${color}`,
            }}
          >
            <Icon size={20} style={{ color }} />
          </div>

          <div className="flex-1">
            <div className="flex items-baseline justify-between pr-10">
              <h4 className="text-sm font-medium text-gray-700">
                {isDepositFallback ? "Deposit" : "Withdrawal"}
              </h4>

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

        {creatorName ? (
          <div className="absolute bottom-3 right-3 text-xs text-slate-500">
            by <span className="font-semibold">{creatorName}</span>
          </div>
        ) : null}
      </div>

      {isModalOpen && (
        <ContributionModal
          transaction={transaction}
          onClose={closeModal}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
