"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Mic,
  Sparkles,
  RefreshCw,
  Menu,
} from "lucide-react";

import {
  ChatMessage,
  AgentEvent,
  AgentApiResponse,
} from "@/lib/types";

import { ChatMessageItem } from "./ChatMessageItem";
import { DemoScenariosPanel } from "./DemoScenariosPanel";
import { CustomerContextPanel } from "./CustomerContextPanel";
import { useSidebar } from "@/components/layout/AppShell";

export function ChatInterface() {
  const { openSidebar } = useSidebar();

  // ============================================================
  // SESSION STATE
  // ============================================================

  const [sessionId, setSessionId] = useState<string>(
    "session_default_001"
  );

  const [customerId, setCustomerId] =
    useState<string>("cust_001");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_init",
      sender: "assistant",
      text:
        "Hello! I'm your AI Customer Support Agent. I can help you check orders and process eligible refunds. How can I help you today?",
      timestamp: "Just now",
    },
  ]);

  const [inputMessage, setInputMessage] =
    useState<string>("");

  const [isLoading, setIsLoading] =
    useState<boolean>(false);

  const [isProcessingRefund, setIsProcessingRefund] =
    useState<boolean>(false);

  const [voiceTooltip, setVoiceTooltip] =
    useState<boolean>(false);

  // ============================================================
  // CUSTOMER PROFILE
  // ============================================================

  const [customerProfile, setCustomerProfile] = useState({
    id: "cust_001",
    name: "Alice Smith",
    email: "alice.smith@example.com",
    phone: "+1-555-0101",
  });

  // ============================================================
  // RECENT ORDER
  // ============================================================

  const [recentOrder, setRecentOrder] = useState({
    id: "ORD-ELIGIBLE-101",
    productName:
      "Sony WH-1000XM5 Wireless Headphones",
    amount: 399.99,
    status: "Delivered",
    refundStatus: "Not Requested",
    deliveryDate: "5 days ago",
  });

  const chatBottomRef =
    useRef<HTMLDivElement>(null);

  const inputRef =
    useRef<HTMLInputElement>(null);

  // ============================================================
  // AUTO SCROLL
  // ============================================================

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, isLoading]);

  // ============================================================
  // CUSTOMER SWITCHING
  // ============================================================

  const handleSelectCustomer = (
    newCustomerId: string
  ) => {
    setCustomerId(newCustomerId);

    if (newCustomerId === "cust_001") {
      setCustomerProfile({
        id: "cust_001",
        name: "Alice Smith",
        email: "alice.smith@example.com",
        phone: "+1-555-0101",
      });

      setRecentOrder({
        id: "ORD-ELIGIBLE-101",
        productName:
          "Sony WH-1000XM5 Wireless Headphones",
        amount: 399.99,
        status: "Delivered",
        refundStatus: "Not Requested",
        deliveryDate: "5 days ago",
      });
    }

    else if (newCustomerId === "cust_002") {
      setCustomerProfile({
        id: "cust_002",
        name: "Bob Johnson",
        email: "bob.johnson@example.com",
        phone: "+1-555-0102",
      });

      setRecentOrder({
        id: "ORD-EXPIRED-102",
        productName:
          "Apple Watch Series 9 GPS 45mm",
        amount: 429.0,
        status: "Delivered",
        refundStatus: "Not Requested",
        deliveryDate: "45 days ago",
      });
    }

    else if (newCustomerId === "cust_003") {
      setCustomerProfile({
        id: "cust_003",
        name: "Charlie Brown",
        email: "charlie.brown@example.com",
        phone: "+1-555-0103",
      });

      setRecentOrder({
        id: "ORD-REFUNDED-103",
        productName:
          "Logitech MX Master 3S Mouse",
        amount: 99.99,
        status: "Delivered",
        refundStatus: "Completed",
        deliveryDate: "12 days ago",
      });
    }
  };

  // ============================================================
  // HELPER: FIND ORDER ID FROM EVENTS
  // ============================================================

  const getOrderIdFromEvents = (
    events?: AgentEvent[]
  ): string | undefined => {
    if (!events || events.length === 0) {
      return undefined;
    }

    for (const event of events) {
      const metadata = event.metadata as any;

      // Direct metadata orderId
      if (
        metadata &&
        typeof metadata.orderId === "string"
      ) {
        return metadata.orderId;
      }

      // Tool arguments
      if (
        metadata &&
        metadata.arguments &&
        typeof metadata.arguments.orderId === "string"
      ) {
        return metadata.arguments.orderId;
      }

      // Tool result
      if (
        metadata &&
        metadata.result &&
        typeof metadata.result.orderId === "string"
      ) {
        return metadata.result.orderId;
      }
    }

    return undefined;
  };

  // ============================================================
  // HELPER: FIND REFUND REASON FROM EVENTS
  // ============================================================

  const getRefundReasonFromEvents = (
    events?: AgentEvent[]
  ): string | undefined => {
    if (!events || events.length === 0) {
      return undefined;
    }

    for (const event of events) {
      const metadata = event.metadata as any;

      // Direct reason
      if (
        metadata &&
        typeof metadata.reason === "string"
      ) {
        return metadata.reason;
      }

      // Reason array
      if (
        metadata &&
        Array.isArray(metadata.reason) &&
        metadata.reason.length > 0
      ) {
        return metadata.reason.join(" ");
      }

      // Tool result reasons
      if (
        metadata &&
        metadata.result &&
        Array.isArray(metadata.result.reasons) &&
        metadata.result.reasons.length > 0
      ) {
        return metadata.result.reasons.join(" ");
      }

      // Tool result single reason
      if (
        metadata &&
        metadata.result &&
        typeof metadata.result.reason === "string"
      ) {
        return metadata.result.reason;
      }
    }

    return undefined;
  };

  // ============================================================
  // REFUND CARD DETECTION
  // ============================================================

  const detectRefundCard = (
    text: string,
    events?: AgentEvent[]
  ): ChatMessage["refundCard"] | undefined => {
    const lowerText = text.toLowerCase();

    // ----------------------------------------------------------
    // 1. REFUND PROCESSED
    // ----------------------------------------------------------

    const processedEvt = events?.find(
      (e) =>
        e.eventType === "REFUND_PROCESSED" ||
        (
          e.status === "SUCCESS" &&
          e.toolName === "processRefund"
        )
    );

    if (processedEvt) {
      const metadata =
        processedEvt.metadata as any;

      const orderId =
        getOrderIdFromEvents(events) ||
        text.match(/\bORD-[A-Z0-9-]+\b/i)?.[0];

      if (!orderId) {
        return undefined;
      }

      const amountMatch =
        text.match(/\$([0-9]+(?:\.[0-9]{2})?)/);

      const amount =
        amountMatch
          ? parseFloat(amountMatch[1])
          : metadata?.amount ||
          metadata?.result?.refundAmount ||
          0;

      const refundIdMatch =
        text.match(/REF-[A-Z0-9-]+/i) ||
        text.match(/ref_[a-z0-9_]+/i);

      const refundId =
        refundIdMatch?.[0] ||
        metadata?.refundId ||
        metadata?.result?.refundId ||
        "REF-COMPLETED";

      setRecentOrder((prev) => ({
        ...prev,
        id: orderId,
        amount: amount || prev.amount,
        refundStatus: "Completed",
      }));

      return {
        type: "success",
        orderId,
        amount,
        refundId,
      };
    }

    // Also support successful text response
    if (
      lowerText.includes(
        "has been processed successfully"
      ) ||
      lowerText.includes(
        "has been successfully processed"
      )
    ) {
      const orderMatch =
        text.match(/\bORD-[A-Z0-9-]+\b/i);

      if (!orderMatch) {
        return undefined;
      }

      const amountMatch =
        text.match(/\$([0-9]+(?:\.[0-9]{2})?)/);

      const amount = amountMatch
        ? parseFloat(amountMatch[1])
        : recentOrder.amount;

      const refundIdMatch =
        text.match(/REF-[A-Z0-9-]+/i);

      setRecentOrder((prev) => ({
        ...prev,
        id: orderMatch[0].toUpperCase(),
        amount,
        refundStatus: "Completed",
      }));

      return {
        type: "success",
        orderId: orderMatch[0].toUpperCase(),
        amount,
        refundId:
          refundIdMatch?.[0] ||
          "REF-COMPLETED",
      };
    }

    // ----------------------------------------------------------
    // 2. REFUND DENIED
    // IMPORTANT: THIS MUST COME BEFORE CONFIRMATION
    // ----------------------------------------------------------

    const deniedEvt = events?.find(
      (e) =>
        e.eventType === "REFUND_DENIED" ||
        (
          e.status === "DENIED" &&
          e.toolName === "checkRefundEligibility"
        )
    );

    if (deniedEvt) {
      // FIRST priority: event data
      const eventOrderId =
        getOrderIdFromEvents(events);

      // SECOND priority: message text
      const textOrderId =
        text.match(/\bORD-[A-Z0-9-]+\b/i)?.[0];

      // DO NOT FALL BACK TO recentOrder.id HERE
      const orderId =
        eventOrderId ||
        textOrderId;

      // If we cannot determine the order, don't create
      // a misleading denial card.
      if (!orderId) {
        return undefined;
      }

      const reason =
        getRefundReasonFromEvents(events) ||
        (
          text.includes("because:")
            ? text
              .split("because:")[1]
              ?.trim()
            : undefined
        ) ||
        (
          text.includes("Reason:")
            ? text
              .split("Reason:")[1]
              ?.trim()
            : undefined
        ) ||
        "Refund window has expired (exceeds 30-day limit).";

      // Update right panel with the ACTUAL denied order
      setRecentOrder((prev) => ({
        ...prev,
        id: orderId,
        refundStatus: "Not Eligible",
      }));

      return {
        type: "denied",
        orderId,
        reason,
      };
    }

    // ----------------------------------------------------------
    // 3. TEXT-BASED DENIAL
    // Only trigger when the assistant message itself clearly
    // indicates a refund denial.
    // ----------------------------------------------------------

    const explicitDenial =
      lowerText.includes(
        "not eligible for a refund"
      ) ||
      lowerText.includes(
        "refund denied"
      ) ||
      (
        lowerText.includes("refund window") &&
        (
          lowerText.includes("expired") ||
          lowerText.includes("exceeds")
        )
      );

    if (explicitDenial) {
      const orderMatch =
        text.match(/\bORD-[A-Z0-9-]+\b/i);

      // Do NOT use recentOrder fallback here.
      if (!orderMatch) {
        return undefined;
      }

      const orderId =
        orderMatch[0].toUpperCase();

      let reason =
        "Refund window has expired (exceeds 30-day limit).";

      if (text.includes("because:")) {
        reason =
          text
            .split("because:")[1]
            ?.trim() || reason;
      }

      else if (text.includes("Reason:")) {
        reason =
          text
            .split("Reason:")[1]
            ?.trim() || reason;
      }

      setRecentOrder((prev) => ({
        ...prev,
        id: orderId,
        refundStatus: "Not Eligible",
      }));

      return {
        type: "denied",
        orderId,
        reason,
      };
    }

    // ----------------------------------------------------------
    // 4. REFUND CONFIRMATION
    // ----------------------------------------------------------

    const confirmationEvt = events?.find(
      (e) =>
        e.eventType === "CONFIRMATION_REQUESTED" ||
        e.eventType === "REFUND_APPROVED"
    );

    if (confirmationEvt) {
      const eventOrderId =
        getOrderIdFromEvents(events);

      const textOrderId =
        text.match(/\bORD-[A-Z0-9-]+\b/i)?.[0];

      const orderId =
        eventOrderId ||
        textOrderId;

      if (!orderId) {
        return undefined;
      }

      const metadata =
        confirmationEvt.metadata as any;

      const amountMatch =
        text.match(/\$([0-9]+(?:\.[0-9]{2})?)/);

      const amount =
        amountMatch
          ? parseFloat(amountMatch[1])
          : metadata?.amount ||
          metadata?.result?.refundAmount ||
          recentOrder.amount;

      setRecentOrder((prev) => ({
        ...prev,
        id: orderId,
        amount,
        refundStatus: "Pending Confirmation",
      }));

      return {
        type: "confirmation",
        orderId,
        productName:
          recentOrder.productName ||
          "Eligible Item",
        amount,
      };
    }

    // Text-based confirmation
    if (
      lowerText.includes(
        "do you want to proceed with the refund"
      ) ||
      lowerText.includes(
        "would you like me to process the refund"
      ) ||
      lowerText.includes(
        "proceed with the refund"
      )
    ) {
      const orderMatch =
        text.match(/\bORD-[A-Z0-9-]+\b/i);

      if (!orderMatch) {
        return undefined;
      }

      const amountMatch =
        text.match(/\$([0-9]+(?:\.[0-9]{2})?)/);

      const amount =
        amountMatch
          ? parseFloat(amountMatch[1])
          : recentOrder.amount;

      const orderId =
        orderMatch[0].toUpperCase();

      setRecentOrder((prev) => ({
        ...prev,
        id: orderId,
        amount,
        refundStatus: "Pending Confirmation",
      }));

      return {
        type: "confirmation",
        orderId,
        productName:
          recentOrder.productName ||
          "Eligible Item",
        amount,
      };
    }

    // ----------------------------------------------------------
    // 5. NOTHING DETECTED
    // ----------------------------------------------------------

    return undefined;
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage = async (
    messageText: string,
    overrideCustomerId?: string
  ) => {
    const trimmed =
      messageText.trim();

    if (!trimmed || isLoading) {
      return;
    }

    const activeCustomer =
      overrideCustomerId || customerId;

    // Add customer message immediately
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: trimmed,
      timestamp:
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
    };

    setMessages((prev) => [
      ...prev,
      userMsg,
    ]);

    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/agent",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            customerId:
              activeCustomer,
            sessionId:
              sessionId ||
              `session_${Date.now()}`,
          }),
        }
      );

      const data: AgentApiResponse =
        await response.json();

      console.log(
        "AGENT API RESPONSE:",
        data
      );

      if (
        !response.ok &&
        !data.message
      ) {
        throw new Error(
          data.error ||
          "Failed to reach AI Customer Support agent."
        );
      }

      // --------------------------------------------------------
      // IMPORTANT
      // Only create refund cards when there is actual evidence.
      // --------------------------------------------------------

      const card =
        detectRefundCard(
          data.message || "",
          data.events || []
        );

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: "assistant",
        text:
          data.message ||
          "The AI service did not return a response.",
        timestamp:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        events: data.events,
        refundCard: card,
        isError: !data.success,
      };

      setMessages((prev) => [
        ...prev,
        assistantMsg,
      ]);
    }

    catch (err) {
      console.error(
        "Agent chat error:",
        err
      );

      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "assistant",
        text:
          "I'm having trouble connecting with the refund service right now. Please verify your connection or try again in a moment.",
        timestamp:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
        isError: true,

        // IMPORTANT:
        // No refundCard here.
        // A service error must NOT create a fake
        // refund denied/approved card.
        refundCard: undefined,
      };

      setMessages((prev) => [
        ...prev,
        errorMsg,
      ]);
    }

    finally {
      setIsLoading(false);
      setIsProcessingRefund(false);
    }
  };

  // ============================================================
  // CONFIRM REFUND
  // ============================================================

  const handleConfirmRefund = async (
    orderId: string
  ) => {
    setIsProcessingRefund(true);

    await sendMessage(
      `Yes, please process the refund for order ${orderId}.`
    );
  };

  // ============================================================
  // CANCEL REFUND
  // ============================================================

  const handleCancelRefund = (
    orderId: string
  ) => {
    sendMessage(
      `No, please do not process the refund for order ${orderId}.`
    );
  };

  // ============================================================
  // DEMO SCENARIO
  // ============================================================

  const handleSelectScenario = (
    scenario: {
      orderId: string;
      customerId: string;
      prompt: string;
    }
  ) => {
    handleSelectCustomer(
      scenario.customerId
    );

    sendMessage(
      scenario.prompt,
      scenario.customerId
    );
  };

  // ============================================================
  // RESET SESSION
  // ============================================================

  const handleResetSession = () => {
    const newSessionId =
      `session_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 9)}`;

    setSessionId(newSessionId);

    setMessages([
      {
        id: `msg_init_${Date.now()}`,
        sender: "assistant",
        text:
          "Hello! I'm your AI Customer Support Agent. I can help you check orders and process eligible refunds. How can I help you today?",
        timestamp:
          new Date().toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
      },
    ]);
  };

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="flex flex-1 flex-col h-full bg-slate-50">

      {/* ======================================================
          TOP HEADER
      ====================================================== */}

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
                AI Customer Support
              </h1>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />

                AI Agent ● Online

              </span>

            </div>

            <p className="hidden text-xs text-slate-500 sm:block">
              Ask our AI agent about orders, refunds and customer support.
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2.5">

          <button
            onClick={handleResetSession}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">
              New Session
            </span>
          </button>

        </div>

      </div>

      {/* ======================================================
          MAIN CONTAINER
      ====================================================== */}

      <div className="flex flex-1 flex-col lg:flex-row gap-6 p-4 sm:p-6 max-w-7xl w-full mx-auto">

        {/* LEFT COLUMN */}

        <div className="flex flex-1 flex-col min-w-0 space-y-4">

          <DemoScenariosPanel
            onSelectScenario={
              handleSelectScenario
            }
            disabled={isLoading}
          />

          {/* CHAT WINDOW */}

          <div className="flex flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden min-h-[520px]">

            {/* MESSAGES */}

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/40">

              {messages.map((msg) => (
                <ChatMessageItem
                  key={msg.id}
                  message={msg}
                  onConfirmRefund={
                    handleConfirmRefund
                  }
                  onCancelRefund={
                    handleCancelRefund
                  }
                  isProcessingRefund={
                    isProcessingRefund
                  }
                />
              ))}

              {/* LOADING */}

              {isLoading && (
                <div className="flex items-center gap-3 animate-in fade-in duration-200">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                    <Sparkles className="h-4 w-4 animate-spin" />
                  </div>

                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-xs border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-2xs">

                    <div className="flex space-x-1">

                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce" />

                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />

                      <div className="h-2 w-2 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />

                    </div>

                    <span className="font-semibold text-slate-700 ml-1">
                      AI Agent is thinking...
                    </span>

                  </div>

                </div>
              )}

              <div ref={chatBottomRef} />

            </div>

            {/* QUICK ACTIONS */}

            <div className="border-t border-slate-100 bg-white px-4 py-2.5 flex flex-wrap items-center gap-2">

              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
                Quick Actions:
              </span>

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  sendMessage(
                    "Can you please check the status of my recent order?"
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Check my order
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  sendMessage(
                    `I would like to request a refund for order ${recentOrder.id}.`
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Request a refund
              </button>

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  sendMessage(
                    "What are the requirements of your refund policy?"
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50/60 hover:text-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Refund policy
              </button>

            </div>

            {/* MESSAGE INPUT */}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(inputMessage);
              }}
              className="border-t border-slate-200/80 bg-white p-3 sm:p-4"
            >

              <div className="flex items-center gap-2">

                {/* VOICE */}

                <div className="relative">

                  <button
                    type="button"
                    onClick={() =>
                      setVoiceTooltip(
                        !voiceTooltip
                      )
                    }
                    onMouseEnter={() =>
                      setVoiceTooltip(true)
                    }
                    onMouseLeave={() =>
                      setVoiceTooltip(false)
                    }
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"
                    aria-label="Voice input"
                  >
                    <Mic className="h-5 w-5" />
                  </button>

                  {voiceTooltip && (
                    <div className="absolute bottom-full left-0 mb-2 z-30 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-[11px] font-medium text-white shadow-md animate-in fade-in zoom-in-95 duration-150">
                      Voice support coming soon
                      <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-slate-900" />
                    </div>
                  )}

                </div>

                {/* INPUT */}

                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) =>
                    setInputMessage(
                      e.target.value
                    )
                  }
                  placeholder="Ask about your order or refund..."
                  disabled={isLoading}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-colors disabled:opacity-60"
                />

                {/* SEND */}

                <button
                  type="submit"
                  disabled={
                    !inputMessage.trim() ||
                    isLoading
                  }
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
                >
                  <span className="hidden sm:inline">
                    Send
                  </span>

                  <Send className="h-4 w-4" />

                </button>

              </div>

            </form>

          </div>

        </div>

        {/* ====================================================
            RIGHT CUSTOMER PANEL
        ==================================================== */}

        <CustomerContextPanel
          currentCustomerId={customerId}
          onSelectCustomer={
            handleSelectCustomer
          }
          customerProfile={
            customerProfile
          }
          recentOrder={
            recentOrder
          }
        />

      </div>

    </div>
  );
}