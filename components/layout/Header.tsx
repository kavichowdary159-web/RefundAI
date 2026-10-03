"use client";

import React from "react";
import { Menu, Sparkles } from "lucide-react";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
  subtitle?: string;
  activeSessionId?: string;
  onResetSession?: () => void;
}

export function Header({
  onMenuClick,
  title = "AI Customer Support",
  subtitle = "Ask our AI agent about orders, refunds and customer support.",
  activeSessionId,
  onResetSession,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-18 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
          aria-label="Open mobile navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
              {title}
            </h1>
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI Agent ● Online
            </span>
          </div>
          {subtitle && (
            <p className="hidden text-xs text-slate-500 md:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Mobile status indicator */}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:hidden">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>

        {activeSessionId && (
          <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-600 xl:flex">
            <span className="text-slate-400">Session:</span>
            <span className="font-mono text-slate-700 font-medium">
              {activeSessionId.length > 18
                ? `${activeSessionId.slice(0, 14)}...`
                : activeSessionId}
            </span>
          </div>
        )}

        {onResetSession && (
          <button
            onClick={onResetSession}
            type="button"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Start a fresh chat session"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            New Session
          </button>
        )}
      </div>
    </header>
  );
}
