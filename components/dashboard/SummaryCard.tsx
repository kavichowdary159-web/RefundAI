"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  badge?: string;
  badgeColor?: string;
}

export function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  badgeColor = "bg-blue-50 text-blue-700 border-blue-200",
}: SummaryCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {value}
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            <span className="text-[11px] font-semibold text-emerald-600">
              {trend}
            </span>
          )}
          {badge && (
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {subtitle && (
        <div className="mt-2 text-xs text-slate-500">{subtitle}</div>
      )}
    </div>
  );
}
