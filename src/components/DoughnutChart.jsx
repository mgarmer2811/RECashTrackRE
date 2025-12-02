import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "react";
import { VictoryPie, VictoryTooltip } from "victory";
import { CATEGORY_MAP } from "../app/utils/Utils";

export default function DoughnutChart({ userId, height = 300 }) {
  const [transactions, setTransactions] = useState([]);
  const containerRef = useRef(null);
  const [chartWidth, setChartWidth] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const { signal } = controller;

    const fetchTransactions = async () => {
      try {
        const url = `http://localhost:5050/api/transactions/get?userId=${userId}`;
        const res = await fetch(url, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          signal,
        });
        if (!res.ok) {
          if (signal.aborted) return;
          return setTransactions([]);
        }
        const data = await res.json();
        if (!signal.aborted) setTransactions(data.transactions ?? []);
      } catch (err) {
        if (signal.aborted) return;
        setTransactions([]);
      }
    };

    fetchTransactions();

    return () => controller.abort();
  }, [userId]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== false) {
        return false;
      }
      const cat = Number(t.category);
      if (!Number.isFinite(cat)) return false;
      if (cat < 1 || cat > 8) return false;

      return true;
    });
  }, [transactions]);

  const aggregated = useMemo(() => {
    const map = new Map();

    for (const t of filtered) {
      const id = Number(t.category);
      const meta = CATEGORY_MAP[id] ?? { name: `#${id}`, color: "#999" };
      const label = meta.name;
      const color = meta.color;
      const amount = Number(t.quantity) || 0;

      const prev = map.get(label) ?? { total: 0, color };
      map.set(label, { total: prev.total + amount, color });
    }

    return Array.from(map.entries())
      .map(([category, { total, color }]) => ({ x: category, y: total, color }))
      .sort((a, b) => b.y - a.y);
  }, [filtered]);

  const handleResize = useCallback(() => {
    if (containerRef.current) {
      const parentWidth = containerRef.current.offsetWidth;
      setChartWidth(Math.max(Math.round(parentWidth * 0.8), 180));
    }
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [handleResize]);

  useEffect(() => {
    handleResize();
  }, [handleResize]);

  if (!aggregated || aggregated.length === 0) return null;

  const chartHeight = Math.max(height, 180);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: chartHeight, position: "relative" }}
    >
      <VictoryPie
        data={aggregated}
        width={chartWidth}
        height={chartHeight}
        colorScale={aggregated.map((item) => item.color)}
        labelComponent={
          <VictoryTooltip
            pointerLength={8}
            cornerRadius={6}
            flyoutStyle={{ fill: "#fff", stroke: "#ccc", padding: 8 }}
            style={{ fill: "#333", fontSize: 12 }}
            constrainToVisibleArea
          />
        }
        labels={({ datum }) => `${datum.x}\n${Number(datum.y).toFixed(2)}`}
        style={{
          parent: { overflow: "visible" },
          data: {
            fill: ({ datum }) => datum.color,
            stroke: "#fff",
            strokeWidth: 1,
          },
          labels: { fontSize: 10 },
        }}
      />
    </div>
  );
}
