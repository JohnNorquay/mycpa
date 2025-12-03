"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  CreditCard,
  Calculator,
  FileText,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tax Debt",
    href: "/tax-debt",
    icon: Receipt,
  },
  {
    label: "Cash Flow",
    href: "/cash-flow",
    icon: Wallet,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    label: "Tax Center",
    href: "/tax-center",
    icon: Calculator,
  },
  {
    label: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-4 top-4 z-50 rounded-md p-2 lg:hidden dark:bg-gray-800 dark:text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r transition-transform duration-200 ease-in-out lg:translate-x-0",
          "dark:border-gray-800 dark:bg-gray-900",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center border-b px-6 dark:border-gray-800">
          <h1 className="text-xl font-bold dark:text-white">CPA Bot</h1>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          {navItems.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              onClick={() => setIsOpen(false)}
            />
          ))}
        </nav>
      </aside>
    </>
  );
}
