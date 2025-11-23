"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function MobileAccordion({ panels = [] }) {
  const [openMap, setOpenMap] = useState({});

  const toggle = (key) => {
    setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="md:hidden space-y-3">
      {panels.map(({ key, title, subtitle, content }) => {
        const isOpen = !!openMap[key];
        return (
          <div
            key={key}
            className="bg-white border border-gray-100 rounded-lg shadow overflow-hidden"
          >
            <button
              onClick={() => toggle(key)}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div>
                <div className="font-medium text-gray-700">{title}</div>
                {subtitle && (
                  <div className="text-sm text-gray-500">{subtitle}</div>
                )}
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            <div
              id={`panel-${key}`}
              className={`px-4 pb-4 transition-[max-height] duration-300 ease-in-out overflow-hidden ${
                isOpen ? "max-h-[1000px] pt-0" : "max-h-0"
              }`}
            >
              <div className="pt-2">{content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
