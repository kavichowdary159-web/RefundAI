"use client";

import React from "react";
import { User, CheckCircle2, ShoppingBag, ShieldCheck } from "lucide-react";


interface CustomerContextPanelProps {
  currentCustomerId: string;
  onSelectCustomer?: (customerId: string) => void;
  recentOrder?: {
    id: string;
    productName: string;
    amount: number;
    status: string;
    refundStatus: string;
    deliveryDate?: string | null;
  } | null;
  customerProfile?: {
    name: string;
    email: string;
    id: string;
    phone?: string | null;
  };
}

export function CustomerContextPanel({
  currentCustomerId,
  onSelectCustomer,
  recentOrder = {
    id: "ORD-ELIGIBLE-101",
    productName: "Sony WH-1000XM5 Wireless Headphones",
    amount: 399.99,
    status: "Delivered",
    refundStatus: "Not Requested",
    deliveryDate: "5 days ago",
  },
  customerProfile = {
    name: "Alice Smith",
    email: "alice.smith@example.com",
    id: "cust_001",
    phone: "+1-555-0101",
  },
}: CustomerContextPanelProps) {
  // Preset quick customers for the hiring assignment demo
  const demoCustomers = [
    { id: "cust_001", name: "Alice Smith (Eligible Order)", active: currentCustomerId === "cust_001" },
    { id: "cust_002", name: "Bob Johnson (Expired Order)", active: currentCustomerId === "cust_002" },
    { id: "cust_003", name: "Charlie Brown (Already Refunded)", active: currentCustomerId === "cust_003" },
  ];

  return (
    <aside className="w-full lg:w-80 shrink-0 space-y-4">
      {/* Customer Profile Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <User className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Customer Context
            </h3>
          </div>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
            Verified Buyer
          </span>
        </div>

        {/* Customer Switcher */}
        {onSelectCustomer && (
          <div className="mt-3.5 mb-3">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              Active Persona:
            </label>
            <select
              value={currentCustomerId}
              onChange={(e) => onSelectCustomer(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-medium text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
            >
              {demoCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-3 space-y-2 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block">Customer Name</span>
            <span className="font-semibold text-slate-800 text-sm">
              {customerProfile.name}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <span className="text-[11px] text-slate-400 block">Customer ID</span>
              <span className="font-mono text-xs font-medium text-slate-700">
                {customerProfile.id}
              </span>
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block">Phone</span>
              <span className="text-xs font-medium text-slate-700">
                {customerProfile.phone || "—"}
              </span>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[11px] text-slate-400 block">Email Address</span>
            <span className="text-xs font-medium text-slate-700 truncate block">
              {customerProfile.email}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Order Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Recent Order
            </h3>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            Primary Target
          </span>
        </div>

        {recentOrder ? (
          <div className="mt-3.5 space-y-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Order ID</span>
              <span className="font-mono text-sm font-bold text-blue-600">
                {recentOrder.id}
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Product</span>
              <span className="font-semibold text-slate-800 leading-snug block">
                {recentOrder.productName}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Amount</span>
                <span className="text-sm font-bold text-slate-900">
                  ${recentOrder.amount.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-0.5">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {recentOrder.status}
                </span>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Refund Status</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    recentOrder.refundStatus === "Completed" || recentOrder.refundStatus === "COMPLETED"
                      ? "bg-emerald-100 text-emerald-800"
                      : recentOrder.refundStatus === "Approved" || recentOrder.refundStatus === "APPROVED"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {recentOrder.refundStatus}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No order found for this customer.
          </div>
        )}
      </div>

      {/* Security & Verification Callout */}
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-blue-50/30 p-4 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-semibold mb-1">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <span>Server-Side Guardrails</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Order ownership and delivery thresholds are validated in backend queries before any refund evaluation.
        </p>
      </div>
    </aside>
  );
}
