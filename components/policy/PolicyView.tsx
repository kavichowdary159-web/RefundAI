"use client";

import React from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  UserCheck,
  PackageCheck,
  DollarSign,
  FileCheck2,
  Lock,
  Menu,
} from "lucide-react";
import { useSidebar } from "@/components/layout/AppShell";

export function PolicyView() {
  const { openSidebar } = useSidebar();
  const policyRules = [
    {
      num: 1,
      title: "Order Record Verification",
      icon: PackageCheck,
      summary: "Order must exist in the database.",
      details:
        "The system verifies that the specified order identifier matches an active record in our catalog before initiating evaluation.",
    },
    {
      num: 2,
      title: "Authenticated Customer Ownership",
      icon: UserCheck,
      summary: "Order must belong to the requesting customer.",
      details:
        "Cross-tenant data access is blocked. The customer ID associated with the session must strictly match the customer ID recorded on the order.",
    },
    {
      num: 3,
      title: "Delivery Status Requirement",
      icon: CheckCircle2,
      summary: "Order must be DELIVERED.",
      details:
        "Orders currently in processing or in transit (SHIPPED/PENDING) cannot be refunded through return claims until recorded as delivered.",
    },
    {
      num: 4,
      title: "30-Day Calendar Refund Window",
      icon: Clock,
      summary: "Refund must be requested within 30 calendar days of delivery.",
      details:
        "Evaluated mathematically using milliseconds elapsed since delivery date. Orders delivered more than 30.0 days ago are strictly ineligible.",
    },
    {
      num: 5,
      title: "Single Refund Disbursement Limit",
      icon: FileCheck2,
      summary: "Order must not already have a completed refund.",
      details:
        "Checks existing refund records and order refund status. Duplicate disbursements for previously refunded orders are rejected.",
    },
    {
      num: 6,
      title: "Standard Inventory Only",
      icon: Ban,
      summary: "Clearance and final-sale products are non-refundable.",
      details:
        "Items tagged with clearance flags or marked as final sale are excluded from return and refund policies as stated at checkout.",
    },
    {
      num: 7,
      title: "Anti-Fraud Screening",
      icon: ShieldCheck,
      summary: "Fraudulent orders cannot be refunded.",
      details:
        "Orders flagged by security heuristics or chargeback risk monitors are barred from automated refund execution.",
    },
    {
      num: 8,
      title: "Positive Amount Validation",
      icon: DollarSign,
      summary: "Refund amount must be greater than zero.",
      details:
        "Zero-value or negative refund requests are rejected as invalid amounts.",
    },
    {
      num: 9,
      title: "Refund Ceiling & Shipping Rules",
      icon: Lock,
      summary: "Refund amount cannot exceed the order amount.",
      details:
        "The requested refund cannot exceed the net product charge. Shipping and handling expenses are non-refundable.",
    },
    {
      num: 10,
      title: "Explicit Customer Confirmation",
      icon: AlertTriangle,
      summary: "Customer confirmation is required before final refund execution.",
      details:
        "Even when an order is determined fully eligible, the agent must present the exact refund amount and obtain unambiguous customer consent before executing `processRefund`.",
    },
  ];

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
                Refund Policy
              </h1>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                10 Strict Rules
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Authoritative, deterministic policy rules enforced in lib/refund-policy.ts.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto space-y-6">
        {/* Authoritative Notice Banner Required by User */}
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50/50 p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-2xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Refund decisions are enforced by the server-side policy engine.
              </h2>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                The LLM assistant is not permitted to invent policies or grant discretionary exceptions. All eligibility evaluations are computed by deterministic TypeScript functions in <code className="rounded bg-blue-100/70 px-1.5 py-0.5 font-mono text-[11px] text-blue-800 font-semibold">lib/refund-policy.ts</code> and audited in SQLite.
              </p>
            </div>
          </div>
        </div>

        {/* 10 Rules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {policyRules.map((rule) => {
            const Icon = rule.icon;
            return (
              <div
                key={rule.num}
                className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                        {rule.num}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {rule.title}
                      </h3>
                    </div>
                    <div className="text-slate-400">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-blue-700 mb-1.5">
                    {rule.summary}
                  </p>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {rule.details}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Engine Guardrail #{rule.num}</span>
                  <span className="font-semibold text-emerald-600">Active</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
