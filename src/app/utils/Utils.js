export const CATEGORY_MAP = {
  1: { name: "House Expenses", color: "#1F77B4" },
  2: { name: "Food & Groceries", color: "#2CA02C" },
  3: { name: "Transportation", color: "#FF7F0E" },
  4: { name: "Subscriptions", color: "#9467BD" },
  5: { name: "Health", color: "#E45756" },
  6: { name: "Entertainment", color: "#FFC300" },
  7: { name: "Education", color: "#8C564B" },
  8: { name: "Other", color: "#7F7F7F" },
  9: { name: "Saving", color: "#1d4ed8" },
  10: { name: "Deposit", color: "#1d4ed8" },
  11: { name: "Withdrawal", color: "#C53030" },
};

export function formatEuro(value) {
  return (
    new Intl.NumberFormat("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + "€"
  );
}
