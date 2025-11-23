"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import DollarIcon from "./DollarIcon";
import UserIcon from "./UserIcon";
import FamilyIcon from "./FamilyIcon";
import SettingsIcon from "./SettingsIcon";

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/", icon: UserIcon },
    { label: "Family", href: "/family", icon: FamilyIcon },
    { label: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  return (
    <aside
      className={`
        hidden md:flex md:flex-col
        md:w-[clamp(12rem,14vw,16vw)]
        md:self-start md:sticky
        md:h-[calc(100vh-10vh)]
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
              : pathname === item.href || pathname?.startsWith(item.href + "/");

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
  );
}
