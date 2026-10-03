"use client";

import React, { useEffect, useState } from "react";
import { Search, RefreshCw, MessageSquare, Menu } from "lucide-react";
import { OrderData } from "@/lib/types";
import Link from "next/link";
import { useSidebar } from "@/components/layout/AppShell";

export function OrdersTable() {
  const { openSidebar } = useSidebar();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterScenario, setFilterScenario] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      } else {
        setError(data.error || "Failed to fetch orders");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve order records from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/orders")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data.success) {
            setOrders(data.orders);
          } else {
            setError("Failed to fetch orders");
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Unable to retrieve order records from database.");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = orders.filter((o) => {
    if (filterScenario && !o.isScenarioOrder) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.productName.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.refundStatus.toLowerCase().includes(q)
    );
  });

  const getScenarioBadge = (order: OrderData) => {
    if (!order.isScenarioOrder) return null;

    const styleMap: Record<string, string> = {
      eligible: "bg-emerald-50 text-emerald-700 border-emerald-200",
      expired: "bg-amber-50 text-amber-700 border-amber-200",
      refunded: "bg-slate-100 text-slate-700 border-slate-300",
      clearance: "bg-purple-50 text-purple-700 border-purple-200",
      fraud: "bg-red-50 text-red-700 border-red-200",
      transit: "bg-blue-50 text-blue-700 border-blue-200",
    };

    const style = (order.scenarioType && styleMap[order.scenarioType]) || "bg-blue-50 text-blue-700 border-blue-200";

    return (
      <span
        className={`ml-2 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${style}`}
      >
        {order.scenarioTag}
      </span>
    );
  };

  const getRefundBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "COMPLETED") {
      return (
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
          Completed
        </span>
      );
    }
    if (s === "APPROVED") {
      return (
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-800">
          Approved
        </span>
      );
    }
    if (s === "REJECTED") {
      return (
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[11px] font-semibold text-red-800">
          Rejected
        </span>
      );
    }
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
        Not Requested
      </span>
    );
  };

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
                Orders Management
              </h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                15 SQLite Records
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Highlighted demo scenarios for automated policy eligibility evaluations.
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
          <span>Refresh</span>
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Filters and search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative flex-1 w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID, customer, or product..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <button
              type="button"
              onClick={() => setFilterScenario(!filterScenario)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all cursor-pointer ${
                filterScenario
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filterScenario ? "Showing Demo Scenarios" : "Filter 6 Scenarios Only"}
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {filtered.length} of {orders.length} orders
            </span>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Order ID & Scenario</th>
                  <th className="py-3.5 px-6">Customer</th>
                  <th className="py-3.5 px-6">Product</th>
                  <th className="py-3.5 px-6">Amount</th>
                  <th className="py-3.5 px-6">Order Status</th>
                  <th className="py-3.5 px-6">Refund Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading order records from database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No order records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => {
                    const isKeyDemo = order.isScenarioOrder;
                    return (
                      <tr
                        key={order.id}
                        className={`transition-colors ${
                          isKeyDemo
                            ? "bg-blue-50/20 hover:bg-blue-50/40"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-slate-900">
                              {order.id}
                            </span>
                            {getScenarioBadge(order)}
                          </div>
                        </td>

                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <div>
                            <span className="font-semibold text-slate-800 block">
                              {order.customerName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {order.customerId}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-6 font-medium text-slate-800 max-w-xs truncate">
                          {order.productName}
                        </td>

                        <td className="py-3.5 px-6 whitespace-nowrap font-bold text-slate-900">
                          ${order.amount.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-6 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                              order.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-6 whitespace-nowrap">
                          {getRefundBadge(order.refundStatus)}
                        </td>

                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                          <Link
                            href={`/?order=${order.id}&customer=${order.customerId}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                            <span>Ask Agent</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
