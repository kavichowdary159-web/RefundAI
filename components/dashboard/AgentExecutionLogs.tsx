"use client";

import React, { useState } from "react";
import {
  Terminal,
  Search,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { DBLogItem } from "@/lib/types";

interface AgentExecutionLogsProps {
  logs: DBLogItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function AgentExecutionLogs({
  logs,
  onRefresh,
  isLoading = false,
}: AgentExecutionLogsProps) {
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SUCCESS") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          SUCCESS
        </span>
      );
    }
    if (s === "DENIED" || s === "ERROR" || s === "FAILED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          {s}
        </span>
      );
    }
    if (s === "STARTED") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          STARTED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
        {s || "INFO"}
      </span>
    );
  };

  const filteredLogs = logs.filter((log) => {
    const s = log.status.toUpperCase();
    if (filterStatus === "SUCCESS" && s !== "SUCCESS") return false;
    if (
      filterStatus === "DENIED" &&
      s !== "DENIED" &&
      s !== "ERROR" &&
      s !== "FAILED"
    )
      return false;
    if (filterStatus === "INFO" && s !== "INFO" && s !== "STARTED")
      return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchEvent = log.eventType.toLowerCase().includes(q);
      const matchTool = log.toolName?.toLowerCase().includes(q);
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchSession = log.sessionId.toLowerCase().includes(q);
      return matchEvent || matchTool || matchMsg || matchSession;
    }

    return true;
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
      {/* Header & Controls */}
      <div className="border-b border-slate-100 p-5 sm:flex sm:items-center sm:justify-between sm:space-y-0 space-y-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <Terminal className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Agent Execution Logs
              </h2>
              <span className="text-xs text-slate-500">
                Live Agent Activity & Deterministic Policy Audit Trail
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter Buttons */}
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/70 p-1 text-xs font-semibold">
            {["ALL", "SUCCESS", "DENIED", "INFO"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-2.5 py-1 transition-colors cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs or tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-blue-600 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>
      </div>

      {/* Compliance Notice */}
      <div className="bg-slate-50/80 px-5 py-2.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>
            Only structured tool logs and policy engine events are displayed.
            Private chain-of-thought is not captured.
          </span>
        </div>
        <span className="font-mono font-medium text-slate-600">
          Showing {filteredLogs.length} events
        </span>
      </div>

      {/* Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/40 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4 sm:px-6">Timestamp</th>
              <th className="py-3 px-4">Event Type</th>
              <th className="py-3 px-4">Tool Name</th>
              <th className="py-3 px-4">Message</th>
              <th className="py-3 px-4 text-right sm:pr-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No matching agent execution logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                return (
                  <React.Fragment key={log.id}>
                    <tr
                      onClick={() =>
                        setExpandedLogId(isExpanded ? null : log.id)
                      }
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td suppressHydrationWarning className="py-3 px-4 sm:px-6 whitespace-nowrap font-mono text-[11px] text-slate-500">
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-800 text-[11px]">
                          {log.eventType}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.toolName ? (
                          <span className="rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-700">
                            {log.toolName}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-800 font-medium max-w-md truncate">
                        {log.message}
                      </td>

                      <td className="py-3 px-4 text-right sm:pr-6 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                    </tr>

                    {/* Expandable metadata view */}
                    {isExpanded && log.metadata && (
                      <tr className="bg-slate-50/90">
                        <td colSpan={5} className="px-6 py-3">
                          <div className="rounded-xl border border-slate-200 bg-slate-900 p-3 text-[11px] font-mono text-slate-200">
                            <div className="text-slate-400 mb-1 font-semibold text-[10px] uppercase">
                              Event Metadata & Audit Context (Session:{" "}
                              {log.sessionId})
                            </div>
                            <pre className="overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
