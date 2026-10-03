"use client";

import React from "react";
import { Sparkles, ArrowRight, CheckCircle2, Clock } from "lucide-react";

interface DemoScenariosPanelProps {
  onSelectScenario: (scenario: {
    orderId: string;
    customerId: string;
    prompt: string;
  }) => void;
  disabled?: boolean;
}

export function DemoScenariosPanel({
  onSelectScenario,
  disabled = false,
}: DemoScenariosPanelProps) {
  const scenarios = [
    {
      id: "scenario-1",
      title: "Scenario 1: Eligible Refund",
      orderId: "ORD-ELIGIBLE-101",
      customerId: "cust_001",
      customerName: "Alice Smith",
      description: "Delivered 5 days ago ($399.99). Fully eligible, triggers confirmation card.",
      badge: "Eligible",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      prompt: "Can I get a refund for my order ORD-ELIGIBLE-101?",
      icon: CheckCircle2,
    },
    {
      id: "scenario-2",
      title: "Scenario 2: Expired Refund",
      orderId: "ORD-EXPIRED-102",
      customerId: "cust_002",
      customerName: "Bob Johnson",
      description: "Delivered 45 days ago ($429.00). Exceeds 30-day window, strictly denied.",
      badge: "30-Day Expired",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      prompt: "Can I get a refund for order ORD-EXPIRED-102?",
      icon: Clock,
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Demo Walkthrough Scenarios
            </h3>
            <span className="text-[11px] text-slate-400">
              One-click hiring assignment test cases (calls real /api/agent)
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {scenarios.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.id}
              className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5 hover:bg-slate-50/90 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      {s.title}
                    </span>
                  </div>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${s.badgeColor}`}
                  >
                    {s.badge}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-2">
                  <span className="font-mono font-medium text-slate-700">
                    {s.orderId}
                  </span>
                  <span>•</span>
                  <span>
                    Customer: <strong className="text-slate-700 font-semibold">{s.customerName}</strong> ({s.customerId})
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed mb-3">
                  {s.description}
                </p>
              </div>

              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  onSelectScenario({
                    orderId: s.orderId,
                    customerId: s.customerId,
                    prompt: s.prompt,
                  })
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-blue-600 bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
              >
                <span>Try Scenario</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
