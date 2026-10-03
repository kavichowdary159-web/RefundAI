"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Activity,
  Users,
  Package,
  ShieldCheck,
  Sparkles,
  CheckCircle,
  X,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    name: "Customer Support",
    href: "/",
    icon: MessageSquare,
    badge: "Chat",
  },
  {
    name: "Agent Dashboard",
    href: "/dashboard",
    icon: Activity,
    badge: "Live",
  },
  {
    name: "Customers",
    href: "/customers",
    icon: Users,
    count: "15",
  },
  {
    name: "Orders",
    href: "/orders",
    icon: Package,
    count: "15",
  },
  {
    name: "Refund Policy",
    href: "/policy",
    icon: ShieldCheck,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex h-18 items-center justify-between border-b border-slate-100 px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  RefundAI
                </span>
                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                  PROD
                </span>
              </div>
              <span className="text-xs font-medium text-slate-500">
                AI Customer Support
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-xs border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`h-5 w-5 transition-colors ${
                        isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-600"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        isActive
                          ? "bg-blue-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}

                  {item.count && (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                      {item.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Quick Demo Reference Box */}
          <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800">
                Deterministic Policy
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                Strict Guardrails
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              30-day window, delivered status, and customer confirmation are
              cryptographically enforced by server engine.
            </p>
          </div>
        </div>

        {/* Bottom Section: AI Agent Online Status */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800">
                  AI Agent: Online
                </span>
                <span className="text-[11px] text-slate-500">
                  Ready for customer queries
                </span>
              </div>
            </div>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
        </div>
      </aside>
    </>
  );
}
