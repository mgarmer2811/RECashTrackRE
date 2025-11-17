"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import UserIcon from "./UserIcon";
import FamilyIcon from "./FamilyIcon";
import SettingsIcon from "./SettingsIcon";
import { Menu } from "lucide-react";
import DollarIcon from "./DollarIcon";

export default function Sidebar() {
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

  return (
    <>
      {/* Desktop navigation */}
      <aside
        className={`
          hidden md:flex md:flex-col
          md:w-[clamp(10rem,16vw,20vw)]
          md:self-start md:sticky md:top-8
          md:h-[calc(100vh-4rem)]
          bg-white rounded-lg shadow-lg border border-gray-100
          p-2 mx-6
        `}
      >
        <div className="border-b border-gray-100 rounded-t-2xl">
          <div className="flex items-center gap-2 px-3 py-2">
            <DollarIcon size={28} className="text-gray-600" />
            <h1 className="text-lg font-semibold text-gray-600">RECashTrack</h1>
          </div>
        </div>

        <nav className="p-3 space-y-2 overflow-auto">
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

      {/* Mobile navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[5vh] min-h-[44px] bg-white z-40 flex items-center px-3">
        <div className="flex items-center gap-2">
          <button
            aria-label="Open menu"
            onClick={() => setOpen(true)}
            className="p-2 rounded hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-800" />
          </button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative bg-white w-72 max-w-full h-full shadow-lg p-4">
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
