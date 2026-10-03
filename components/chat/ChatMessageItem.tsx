"use client";

import React, { useEffect, useState } from "react";
import { User, Sparkles, Terminal } from "lucide-react";
import { ChatMessage } from "@/lib/types";
import { RefundConfirmationCard } from "./RefundConfirmationCard";
import { RefundDeniedCard } from "./RefundDeniedCard";
import { RefundSuccessCard } from "./RefundSuccessCard";
import { LiveSessionLogsModal } from "./LiveSessionLogsModal";

interface ChatMessageItemProps {
  message: ChatMessage;
  onConfirmRefund?: (orderId: string) => void;
  onCancelRefund?: (orderId: string) => void;
  isProcessingRefund?: boolean;
}

export function ChatMessageItem({
  message,
  onConfirmRefund,
  onCancelRefund,
  isProcessingRefund = false,
}: ChatMessageItemProps) {
  const [showLogs, setShowLogs] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isUser = message.sender === "user";

  /*
   * Wait until the component has mounted before displaying
   * the timestamp. This prevents server/client locale
   * differences such as:
   *
   * Server: 01:16 pm
   * Client: 01:16 PM
   */
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <div
        className={`flex w-full gap-3 ${isUser ? "justify-end" : "justify-start"
          } animate-in fade-in duration-200`}
      >
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
        )}

        {/* Message Bubble Content */}
        <div
          className={`flex max-w-[85%] flex-col sm:max-w-[78%] ${isUser ? "items-end" : "items-start"
            }`}
        >
          {/* Sender label and time */}
          <div className="mb-1 flex items-center gap-2 px-1 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-600">
              {isUser ? "You (Customer)" : "AI Support Assistant"}
            </span>

            <span>•</span>

            {/* Hydration-safe timestamp */}
            <span suppressHydrationWarning>
              {mounted ? message.timestamp : ""}
            </span>
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-2xl px-4.5 py-3.5 text-sm leading-relaxed ${isUser
                ? "bg-blue-600 text-white shadow-xs rounded-tr-xs"
                : message.isError
                  ? "border border-red-200 bg-red-50 text-red-900 rounded-tl-xs"
                  : "border border-slate-200/80 bg-white text-slate-800 shadow-2xs rounded-tl-xs"
              }`}
          >
            {/* Main text content */}
            <div className="space-y-2 whitespace-pre-wrap">
              {message.text}
            </div>

            {/* Refund Confirmation Card */}
            {message.refundCard?.type === "confirmation" && (
              <RefundConfirmationCard
                orderId={message.refundCard.orderId}
                productName={
                  message.refundCard.productName || "Eligible Item"
                }
                amount={message.refundCard.amount || 0}
                onConfirm={() =>
                  onConfirmRefund?.(message.refundCard!.orderId)
                }
                onCancel={() =>
                  onCancelRefund?.(message.refundCard!.orderId)
                }
                isProcessing={isProcessingRefund}
              />
            )}

            {/* Refund Denied Card */}
            {message.refundCard?.type === "denied" && (
              <RefundDeniedCard
                orderId={message.refundCard.orderId}
                reason={message.refundCard.reason}
              />
            )}

            {/* Refund Success Card */}
            {message.refundCard?.type === "success" && (
              <RefundSuccessCard
                orderId={message.refundCard.orderId}
                amount={message.refundCard.amount || 0}
                refundId={message.refundCard.refundId}
              />
            )}

            {/* Agent Execution Trace */}
            {message.events &&
              message.events.length > 0 &&
              !isUser && (
                <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                  <button
                    type="button"
                    onClick={() => setShowLogs(true)}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
                  >
                    <Terminal className="h-3.5 w-3.5 text-blue-600" />

                    <span>
                      Agent Trace ({message.events.length} events)
                    </span>
                  </button>

                  <span className="text-[10px] text-slate-400">
                    Audit Log Recorded
                  </span>
                </div>
              )}
          </div>
        </div>

        {/* User Avatar */}
        {isUser && (
          <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-xl bg-slate-200 text-slate-700">
            <User className="h-4 w-4" />
          </div>
        )}
      </div>

      {/* Agent Trace Modal */}
      {message.events && message.events.length > 0 && (
        <LiveSessionLogsModal
          isOpen={showLogs}
          onClose={() => setShowLogs(false)}
          events={message.events}
        />
      )}
    </>
  );
}