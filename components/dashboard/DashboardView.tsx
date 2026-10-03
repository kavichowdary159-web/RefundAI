"use client";

import React, { useEffect, useState } from "react";
import { Users, Package, DollarSign, Activity, RefreshCw, Menu } from "lucide-react";
import { DashboardStats, DBLogItem } from "@/lib/types";
import { SummaryCard } from "./SummaryCard";
import { AgentExecutionLogs } from "./AgentExecutionLogs";
import { useSidebar } from "@/components/layout/AppShell";

export function DashboardView() {
  const { openSidebar } = useSidebar();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 15,
    totalOrders: 15,
    refundsProcessed: 1,
    totalRefundedAmount: 99.99,
    agentStatus: "Online",
  });
  const [logs, setLogs] = useState<DBLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setLogs(data.logs);
      } else {
        setError(data.error || "Failed to load dashboard data");
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError("Unable to load latest metrics from server. Showing cached snapshot.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data.success) {
            setStats(data.stats);
            setLogs(data.logs);
          } else {
            setError("Failed to load dashboard data");
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Dashboard fetch error:", err);
          setError("Unable to load latest metrics from server. Showing cached snapshot.");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50">
      {/* Top Header */}
      <div className="sticky top-0 z-20 flex h-18 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openSidebar}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                Agent Dashboard
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Observability Online
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Monitor AI agent decisions, policy evaluations, and real-time execution audit logs.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 text-blue-600 ${
              isLoading ? "animate-spin" : ""
            }`}
          />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
            {error}
          </div>
        )}

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            title="Total Customers"
            value={stats.totalCustomers}
            subtitle="Verified registered buyers in SQLite database"
            icon={Users}
            badge="15 Records"
            badgeColor="bg-blue-50 text-blue-700 border-blue-200"
          />

          <SummaryCard
            title="Total Orders"
            value={stats.totalOrders}
            subtitle="Including 6 pre-configured test scenarios"
            icon={Package}
            badge="15 Records"
            badgeColor="bg-indigo-50 text-indigo-700 border-indigo-200"
          />

          <SummaryCard
            title="Refunds Processed"
            value={stats.refundsProcessed}
            subtitle={`$${stats.totalRefundedAmount.toFixed(2)} total disbursed`}
            icon={DollarSign}
            badge="Audit Verified"
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          />

          <SummaryCard
            title="Agent Status"
            value={stats.agentStatus}
            subtitle="Deterministic Policy Engine Active"
            icon={Activity}
            badge="Healthy"
            badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
          />
        </div>

        {/* Live Agent Activity & Execution Logs */}
        <AgentExecutionLogs
          logs={logs}
          onRefresh={handleRefresh}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
