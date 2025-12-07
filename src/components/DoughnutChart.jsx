"use client";

import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { VictoryPie, VictoryTooltip, VictoryContainer } from "victory";
import { io } from "socket.io-client";
import { CATEGORY_MAP } from "../app/utils/Utils";

function FilterButton({ active, onClick, children, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`min-w-[44px] px-2 py-1 rounded-md text-sm font-semibold transition-colors flex items-center justify-center ${
        active ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function DoughnutChart({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const containerRef = useRef(null);
  const socketRef = useRef(null);

  const calcInitialWidth = () => {
    if (typeof window === "undefined") return 360;
    return Math.min(450, Math.max(Math.round(window.innerWidth * 0.4), 180));
  };

  const [chartWidth, setChartWidth] = useState(() => calcInitialWidth());
  const [range, setRange] = useState("1M");

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const { signal } = controller;

    const fetchTransactions = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_GET_TRANSACTIONS;
        const url = baseUrl
          ? `${baseUrl}?userId=${userId}`
          : `http://localhost:5050/api/transactions/get?userId=${userId}`;
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

  useEffect(() => {
    if (!userId) return;

    const SOCKET_URL = process.env.SOCKET_URL || "http://localhost:5050";
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      if (process.env.NODE_ENV === "development")
        console.log("DoughnutChart socket connected", socket.id);
      socket.emit("join", { userId });
    });

    socket.on("transaction:created", (payload) => {
      const { transaction } = payload || {};
      if (!transaction) return;

      setTransactions((ts) => {
        const exists = ts.some((t) => t.id === transaction.id);
        if (exists) return ts;
        return [...ts, transaction];
      });
    });

    socket.on("transaction:updated", (payload) => {
      const { transaction } = payload || {};
      if (!transaction) return;
      const id = Number(transaction.id);
      if (!id && id !== 0) return;

      setTransactions((ts) => {
        const exists = ts.some((t) => Number(t.id) === id);
        if (exists) {
          return ts.map((t) =>
            Number(t.id) === id ? { ...t, ...transaction, id } : t
          );
        }
        return [...ts, { ...transaction, id }];
      });
    });

    socket.on("transaction:deleted", (payload) => {
      const { transactionId } = payload || {};
      setTransactions((ts) => ts.filter((t) => t.id !== transactionId));
    });

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development")
        console.warn("DoughnutChart socket disconnected. Reason: ", reason);
    });

    return () => {
      try {
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit("leave", { userId });
        }
      } finally {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    };
  }, [userId]);

  const getCutoff = useCallback((r) => {
    if (!r) return null;
    const now = new Date();
    const cutoff = new Date(now);
    if (r === "1W") {
      cutoff.setDate(now.getDate() - 7);
      return cutoff;
    }
    if (r === "1M") {
      cutoff.setMonth(now.getMonth() - 1);
      return cutoff;
    }
    if (r === "1Y") {
      cutoff.setFullYear(now.getFullYear() - 1);
      return cutoff;
    }
    return null;
  }, []);

  const filtered = useMemo(() => {
    const cutoff = getCutoff(range);

    return transactions.filter((t) => {
      if (t.type !== false) return false;

      const cat = Number(t.category);
      if (!Number.isFinite(cat)) return false;
      if (cat < 1 || cat > 8) return false;

      if (cutoff) {
        const raw = t.created_at;
        if (!raw) return false;
        const d = new Date(raw);
        if (!(d instanceof Date) || isNaN(d.getTime())) return false;
        if (d < cutoff) return false;
      }

      return true;
    });
  }, [transactions, getCutoff, range]);

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

  const total = useMemo(
    () => aggregated.reduce((s, it) => s + (Number(it.y) || 0), 0),
    [aggregated]
  );

  const formattedTotal = useMemo(() => {
    try {
      return new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(total);
    } catch (e) {
      return total.toFixed(2);
    }
  }, [total]);

  const handleResize = useCallback(() => {
    const el = containerRef.current;
    const parentWidth = el
      ? el.clientWidth || el.getBoundingClientRect().width
      : typeof window !== "undefined"
      ? window.innerWidth
      : 360;
    const newWidth = Math.min(
      450,
      Math.max(Math.round(parentWidth * 0.9), 180)
    );
    setChartWidth((prev) => (prev === newWidth ? prev : newWidth));
  }, []);

  useLayoutEffect(() => {
    handleResize();
  }, [handleResize]);

  useEffect(() => {
    const ro = new ResizeObserver(() => handleResize());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [handleResize]);

  let chartHeight = Math.max(Math.round(chartWidth * 0.8), 180);
  chartHeight = Math.min(chartHeight, 300);
  const innerRadius = Math.round(Math.min(chartWidth, chartHeight) * 0.12);
  const tooltipFontSize = useMemo(
    () => Math.round(Math.max(10, Math.min(18, chartWidth / 25))),
    [chartWidth]
  );

  const hasData = Boolean(aggregated && aggregated.length > 0 && total > 0);
  const displayedAggregated = aggregated ?? "";

  return (
    <div
      ref={containerRef}
      className="w-full bg-white rounded-xl shadow-lg p-4"
      style={{ minHeight: 180 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-700 pt-1">Expenses</h3>
          <p className="text-sm text-gray-500 mt-1">
            Total: <b>{formattedTotal}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {[
            { id: "1W", label: "1W" },
            { id: "1M", label: "1M" },
            { id: "1Y", label: "1Y" },
          ].map((opt) => {
            const selected = range === opt.id;
            return (
              <FilterButton
                key={opt.id}
                active={selected}
                onClick={() => setRange(selected ? null : opt.id)}
                title={opt.id}
              >
                {opt.label}
              </FilterButton>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:gap-6">
        <div style={{ width: "100%", maxWidth: 420 }} className="mx-auto">
          <div
            style={{
              width: "100%",
              height: chartHeight,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <VictoryPie
              data={displayedAggregated}
              width={chartWidth}
              height={chartHeight}
              padding={0}
              innerRadius={innerRadius}
              containerComponent={
                <VictoryContainer
                  responsive={false}
                  style={{
                    display: "block",
                    margin: "0 auto",
                    width: `${chartWidth}px`,
                    height: `${chartHeight}px`,
                  }}
                />
              }
              origin={{ x: chartWidth / 2, y: chartHeight / 2 }}
              colorScale={displayedAggregated.map((item) => item.color)}
              labelComponent={
                <VictoryTooltip
                  pointerLength={8}
                  cornerRadius={6}
                  flyoutStyle={{ fill: "#fff", stroke: "#e5e7eb", padding: 8 }}
                  style={{ fill: "#111827", fontSize: tooltipFontSize }}
                  constrainToVisibleArea
                />
              }
              labels={({ datum }) => {
                if (!hasData) return `${datum.x}`;
                const value = Number(datum.y) || 0;
                const pct =
                  total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
                return `${datum.x}\n${value.toFixed(2)} (${pct}%)`;
              }}
              style={{
                parent: { overflow: "visible" },
                data: {
                  fill: ({ datum }) => datum.color,
                  stroke: "#fff",
                  strokeWidth: 1,
                },
                labels: {
                  fontSize: Math.max(10, Math.round(tooltipFontSize * 0.8)),
                },
              }}
            />

            {!hasData && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-gray-500 font-semibold">
                    No expenses yet
                  </div>
                  <div className="text-xs text-gray-500">
                    Add expenses to see your spending
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 md:mt-0 md:flex-1">
          <ul className="flex flex-wrap gap-2 text-[0.8rem]">
            {displayedAggregated.map((item) => {
              return (
                <li
                  key={item.x}
                  className={`flex items-center gap-2 p-1 rounded-md truncate ${
                    !hasData ? "opacity-70" : ""
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-sm inline-block flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="truncate max-w-[12rem] text-sm">
                    {item.x}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
