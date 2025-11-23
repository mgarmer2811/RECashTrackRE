"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu } from "lucide-react";
import DollarIcon from "./DollarIcon";
import UserIcon from "./UserIcon";
import FamilyIcon from "./FamilyIcon";
import SettingsIcon from "./SettingsIcon";

export default function Topbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    { label: "Home", href: "/", icon: UserIcon },
    { label: "Family", href: "/family", icon: FamilyIcon },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  let pageTitle = "";
  if (pathname?.includes("/settings")) pageTitle = "Settings";
  else if (pathname?.includes("/family")) pageTitle = "Family";
  else if (pathname === "/") pageTitle = "Home";

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 min-h-[56px] bg-white z-40 flex items-center">
        <div className="pl-3">
          <button
            onClick={() => setOpen((open) => !open)}
            className="p-3 rounded hover:bg-gray-100"
            style={{
              minHeight: 40,
              minWidth: 40,
            }}
          >
            <Menu className="w-6 h-6 text-gray-800" />
          </button>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-lg font-semibold text-gray-700">
            {pageTitle}
          </span>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="relative bg-white w-80 max-w-full h-full shadow-lg p-4">
            <div className="px-2 pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2 px-1 py-1">
                <DollarIcon size={28} className="text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-600">
                  RECashTrack
                </h3>
              </div>
            </div>

            <nav className="flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname === item.href ||
                      pathname?.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <item.icon className="mr-3 w-5 h-5 text-gray-600" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
