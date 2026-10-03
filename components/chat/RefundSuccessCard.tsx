"use client";

import React from "react";
import { CheckCircle2, Receipt } from "lucide-react";

interface RefundSuccessCardProps {
  orderId: string;
  amount: number;
  refundId?: string;
}

export function RefundSuccessCard({
  orderId,
  amount,
  refundId,
}: RefundSuccessCardProps) {
  return (
    <div className="mt-3.5 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Refund Processed Successfully
            </h4>
            <span className="text-[11px] font-medium text-emerald-700">
              Payment Gateway Credited
            </span>
          </div>
        </div>
        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
          Completed
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <span className="text-slate-400 font-medium block mb-0.5">
            Order Reference
          </span>
          <span className="font-mono text-sm font-bold text-slate-800">
            {orderId}
          </span>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-white p-3">
          <span className="text-slate-400 font-medium block mb-0.5">
            Amount Refunded
          </span>
          <span className="text-sm font-bold text-emerald-600">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      {refundId && (
        <div className="mt-3 rounded-xl border border-emerald-100 bg-white p-3 text-xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium block mb-0.5">
              Refund ID
            </span>
            <span className="font-mono text-xs font-semibold text-slate-700">
              {refundId}
            </span>
          </div>
          <Receipt className="h-4 w-4 text-emerald-500" />
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        The transaction has been posted to the database audit log. Funds will
        appear on the customer’s original card statement within 3–5 business
        days.
      </p>
    </div>
  );
}
