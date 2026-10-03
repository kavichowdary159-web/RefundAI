"use client";

import React from "react";
import { X, Terminal } from "lucide-react";
import { AgentEvent } from "@/lib/types";

interface LiveSessionLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: AgentEvent[];
  orderId?: string;
}

export function LiveSessionLogsModal({
  isOpen,
  onClose,
  events,
  orderId,
}: LiveSessionLogsModalProps) {
  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SUCCESS") {
      return (
        <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
          SUCCESS
        </span>
      );
    }
    if (s === "DENIED" || s === "ERROR" || s === "FAILED") {
      return (
        <span className="rounded-md bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700 border border-red-200">
          {s}
        </span>
      );
    }
    return (
      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200">
        {s || "INFO"}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-slate-200 bg-white shadow-xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Agent Execution Trace {orderId ? `(${orderId})` : ""}
              </h3>
              <p className="text-[11px] text-slate-500">
                Structured tool calls and deterministic policy checks
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {events.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No execution events recorded for this step.
            </div>
          ) : (
            events.map((evt, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-xs transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-800">
                      {evt.eventType}
                    </span>
                    {evt.toolName && (
                      <span className="rounded bg-blue-100/70 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-blue-800">
                        {evt.toolName}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(evt.status)}
                </div>

                <p className="text-slate-700 leading-relaxed font-mono text-[11px] mb-2">
                  {evt.message}
                </p>

                {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                  <pre className="rounded-lg bg-slate-900 p-2.5 text-[10px] text-slate-200 overflow-x-auto font-mono">
                    {JSON.stringify(evt.metadata, null, 2)}
                  </pre>
                )}

                <div className="mt-2 text-[10px] text-slate-400">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-3 text-right">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Close Trace
          </button>
        </div>
      </div>
    </div>
  );
}
