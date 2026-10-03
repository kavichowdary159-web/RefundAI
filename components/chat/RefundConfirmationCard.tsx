"use client";

import React from "react";
import { Check, X, DollarSign } from "lucide-react";

interface RefundConfirmationCardProps {
  orderId: string;
  productName: string;
  amount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
  disabled?: boolean;
}

export function RefundConfirmationCard({
  orderId,
  productName,
  amount,
  onConfirm,
  onCancel,
  isProcessing = false,
  disabled = false,
}: RefundConfirmationCardProps) {
  return (
    <div className="mt-3.5 overflow-hidden rounded-2xl border border-blue-200/90 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-5 shadow-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between border-b border-blue-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Refund Request Confirmation
            </h4>
            <span className="text-[11px] font-medium text-blue-600">
              Customer Approval Required
            </span>
          </div>
        </div>
        <span className="rounded-full bg-blue-100/80 px-2.5 py-0.5 text-xs font-bold text-blue-800">
          Eligible
        </span>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <span className="text-slate-400 font-medium block mb-0.5">
            Order Reference
          </span>
          <span className="font-mono text-sm font-bold text-slate-800">
            {orderId}
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3">
          <span className="text-slate-400 font-medium block mb-0.5">
            Refund Amount
          </span>
          <span className="text-sm font-bold text-emerald-600">
            ${amount.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-3 text-xs">
        <span className="text-slate-400 font-medium block mb-0.5">Product</span>
        <span className="text-slate-700 font-semibold">{productName}</span>
      </div>

      <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
        The refund policy engine has verified that this order meets all criteria
        (delivered within 30 days, non-clearance, non-fraudulent). Confirming
        will trigger irreversible payment gateway disbursement.
      </p>

      {/* Action buttons */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled || isProcessing}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
        >
          {isProcessing ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Processing Refund...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Confirm Refund (${amount.toFixed(2)})</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={disabled || isProcessing}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <X className="h-4 w-4 text-slate-400" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  );
}
