export default function TabBar({ activeTab, onChange }) {
  const tabs = ["Operations", "Budgets & Goals"];

  return (
    <div className="flex justify-around mb-4 border-b border-blue-700">
      {tabs.map((tab, index) => (
        <button
          key={tab}
          onClick={() => onChange(index)}
          className={`py-3 w-full text-center font-medium ${
            activeTab === index
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-500"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
