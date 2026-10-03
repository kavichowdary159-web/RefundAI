"use client";

import React, { useEffect, useState } from "react";
import { Search, RefreshCw, MessageSquare, Menu } from "lucide-react";
import { CustomerData } from "@/lib/types";
import Link from "next/link";
import { useSidebar } from "@/components/layout/AppShell";

export function CustomersTable() {
  const { openSidebar } = useSidebar();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      } else {
        setError(data.error || "Failed to fetch customers");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve customer records from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          if (data.success) {
            setCustomers(data.customers);
          } else {
            setError("Failed to fetch customers");
          }
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setError("Unable to retrieve customer records from database.");
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const filtered = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

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
                Customer Directory
              </h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                15 Verified Records
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Read directly from Prisma SQLite database with associated order counts.
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

        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, or ID..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors"
            />
          </div>

          <span className="text-xs text-slate-500 font-medium hidden sm:inline">
            Showing {filtered.length} of {customers.length} customers
          </span>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-6">Customer ID</th>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Email</th>
                  <th className="py-3.5 px-6 text-center">Number of Orders</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Loading customer directory from SQLite...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No customer records match your filter.
                    </td>
                  </tr>
                ) : (
                  filtered.map((customer) => (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900">
                          {customer.id}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {customer.name}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-500">
                        {customer.email}
                      </td>

                      <td className="py-3.5 px-6 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-semibold text-slate-700">
                          {customer.orderCount}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {customer.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-6 text-right whitespace-nowrap">
                        <Link
                          href={`/?customer=${customer.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span>Support Chat</span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
