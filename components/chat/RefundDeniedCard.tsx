"use client";

import React from "react";
import { ShieldAlert, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";

interface RefundDeniedCardProps {
  orderId: string;
  reason?: string;
  policyRule?: string;
}

export function RefundDeniedCard({
  orderId,
  reason = "Refund window has expired.",
  policyRule,
}: RefundDeniedCardProps) {
  return (
    <div className="mt-3.5 overflow-hidden rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-xs transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between border-b border-red-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-600 text-white shadow-xs">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Refund Not Approved
            </h4>
            <span className="text-[11px] font-medium text-red-600">
              Policy Rule Violation
            </span>
          </div>
        </div>
        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
          Denied
        </span>
      </div>

      <div className="mt-4 space-y-2.5 text-xs">
        <div className="rounded-xl border border-red-100/80 bg-white p-3">
          <span className="text-slate-400 font-medium block mb-0.5">
            Order Reference
          </span>
          <span className="font-mono text-sm font-bold text-slate-800">
            {orderId}
          </span>
        </div>

        <div className="rounded-xl border border-red-100/80 bg-white p-3">
          <span className="text-slate-400 font-medium block mb-1">
            Rejection Reason
          </span>
          <div className="flex items-start gap-2 text-slate-700">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium leading-relaxed">{reason}</p>
              {policyRule && (
                <span className="font-mono text-[10px] text-red-600 block mt-1">
                  Policy Rule: {policyRule}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between pt-1 text-[11px]">
        <span className="text-slate-500">
          Enforced strictly by server-side policy engine
        </span>
        <Link
          href="/policy"
          className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-800 underline underline-offset-2"
        >
          <span>View 10 Policy Rules</span>
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
