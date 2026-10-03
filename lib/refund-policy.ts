import { Customer, Order, Refund, OrderStatus, RefundStatus } from "@prisma/client";

export interface PolicyCheck {
  rule: string;
  passed: boolean;
  message: string;
}

export interface RefundEligibilityResult {
  eligible: boolean;
  checks: PolicyCheck[];
  reasons: string[];
  refundAmount: number;
  requiresConfirmation: boolean;
}

export type OrderWithRefund = Order & {
  refund?: Refund | null;
};

export interface RefundEvaluationOptions {
  /**
   * Date of evaluation/request. Defaults to current date.
   */
  requestDate?: Date;
  /**
   * Optional custom requested refund amount. If omitted, defaults to full order amount.
   */
  requestedAmount?: number;
  /**
   * Non-refundable shipping or processing charges to deduct if applicable. Defaults to 0.
   */
  shippingAmount?: number;
}

export const REFUND_POLICY_CONSTANTS = {
  MAX_REFUND_DAYS: 30,
  MS_PER_DAY: 24 * 60 * 60 * 1000,
} as const;

/**
 * Deterministically checks refund eligibility against strict business policies.
 *
 * Rules:
 * 1. A valid customer and order must exist and match.
 * 2. The order must have DELIVERED status.
 * 3. The order must have been delivered within 30 calendar days.
 * 4. The order must not already have a completed refund.
 * 5. Clearance and final-sale products are not refundable.
 * 6. Fraudulent orders are not eligible for refunds.
 * 7. The refund amount cannot exceed the original order amount and cannot be negative.
 * 8. Shipping charges are non-refundable.
 * 9. Explicit customer confirmation is required before refund execution.
 * 10. If any mandatory rule fails, the refund is strictly DENIED.
 *
 * NOTE: The LLM must NEVER make the eligibility decision. This pure function
 * produces the authoritative, deterministic decision for tool calling.
*/
export function checkRefundEligibility(
  order: OrderWithRefund | null | undefined,
  customer: Customer | null | undefined,
  options: RefundEvaluationOptions = {}
): RefundEligibilityResult {
  const checks: PolicyCheck[] = [];
  const reasons: string[] = [];
  const evaluationDate = options.requestDate ? new Date(options.requestDate) : new Date();

  // Rule 1: VALID_ENTITIES - Order and Customer must exist and correspond
  if (!order || !customer) {
    const missingEntity = !order && !customer ? "Customer and order" : !order ? "Order" : "Customer";
    checks.push({
      rule: "VALID_ENTITIES",
      passed: false,
      message: `${missingEntity} record not found.`,
    });
    reasons.push(`${missingEntity} record does not exist.`);

    return {
      eligible: false,
      checks,
      reasons,
      refundAmount: 0,
      requiresConfirmation: true,
    };
  }

  const customerMatches = order.customerId === customer.id;
  checks.push({
    rule: "VALID_ENTITIES",
    passed: customerMatches,
    message: customerMatches
      ? `Order ${order.id} belongs to customer ${customer.name}.`
      : `Order ${order.id} does not belong to customer ${customer.id}.`,
  });
  if (!customerMatches) {
    reasons.push("Order does not belong to the authenticated customer.");
  }

  // Rule 2: ORDER_STATUS - Order must have DELIVERED status
  const isDelivered = order.status === OrderStatus.DELIVERED;
  checks.push({
    rule: "ORDER_STATUS",
    passed: isDelivered,
    message: isDelivered
      ? "Order status is DELIVERED."
      : `Order status is ${order.status}. Only delivered orders are eligible for refunds.`,
  });
  if (!isDelivered) {
    reasons.push(`Order has not been delivered (current status: ${order.status}).`);
  }

  // Rule 3: REFUND_WINDOW - Allowed within 30 calendar days after delivery
  if (!order.deliveryDate) {
    checks.push({
      rule: "REFUND_WINDOW",
      passed: false,
      message: "Order has no recorded delivery date.",
    });
    reasons.push("Order delivery date is missing; cannot verify refund window.");
  } else {
    const deliveryTime = new Date(order.deliveryDate).getTime();
    const diffDays = (evaluationDate.getTime() - deliveryTime) / REFUND_POLICY_CONSTANTS.MS_PER_DAY;
    const isWithinWindow = diffDays >= 0 && diffDays <= REFUND_POLICY_CONSTANTS.MAX_REFUND_DAYS;

    checks.push({
      rule: "REFUND_WINDOW",
      passed: isWithinWindow,
      message: isWithinWindow
        ? `Order was delivered ${Math.floor(diffDays)} day(s) ago (within the 30-day limit).`
        : `Order was delivered ${Math.floor(diffDays)} day(s) ago (exceeds 30-day limit).`,
    });
    if (!isWithinWindow) {
      reasons.push(
        diffDays < 0
          ? "Delivery date is in the future."
          : `Refund window has expired (delivered ${Math.floor(diffDays)} days ago, maximum allowed is 30 days).`
      );
    }
  }

  // Rule 4: EXISTING_REFUND - Must not already have a completed refund
  const hasCompletedRefund =
    order.refundStatus === RefundStatus.COMPLETED ||
    order.refund?.status === RefundStatus.COMPLETED;

  checks.push({
    rule: "EXISTING_REFUND",
    passed: !hasCompletedRefund,
    message: !hasCompletedRefund
      ? "No completed refund found for this order."
      : `Order has already been refunded (Refund ID: ${order.refund?.id ?? "Recorded"}).`,
  });
  if (hasCompletedRefund) {
    reasons.push("Order has already been refunded.");
  }

  // Rule 5: CLEARANCE_ITEM - Clearance and final-sale products are not refundable
  checks.push({
    rule: "CLEARANCE_PRODUCT",
    passed: !order.isClearanceItem,
    message: !order.isClearanceItem
      ? "Product is a standard item and eligible for return."
      : "Product is a clearance/final-sale item and is non-refundable.",
  });
  if (order.isClearanceItem) {
    reasons.push("Clearance and final-sale items are strictly non-refundable.");
  }

  // Rule 6: FRAUD_CHECK - Fraudulent orders are not eligible
  checks.push({
    rule: "FRAUD_CHECK",
    passed: !order.isFraudulent,
    message: !order.isFraudulent
      ? "Order passed fraud verification check."
      : "Order is flagged as fraudulent and is blocked from refund processing.",
  });
  if (order.isFraudulent) {
    reasons.push("Order is flagged for fraudulent activity.");
  }

  // Rule 7 & 8: AMOUNT_VALIDITY & SHIPPING NON-REFUNDABLE
  const shippingDeduction = options.shippingAmount ?? 0;
  const maxAllowableAmount = Math.max(0, order.amount - shippingDeduction);
  const requested = options.requestedAmount !== undefined ? options.requestedAmount : maxAllowableAmount;

  const isAmountValid = requested > 0 && requested <= maxAllowableAmount;
  checks.push({
    rule: "AMOUNT_VALIDITY",
    passed: isAmountValid,
    message: isAmountValid
      ? `Requested refund amount ($${requested.toFixed(2)}) is valid (Order amount: $${order.amount.toFixed(2)}${shippingDeduction > 0 ? `, non-refundable shipping: $${shippingDeduction.toFixed(2)}` : ""}).`
      : `Invalid refund amount requested ($${requested.toFixed(2)}). Must be between $0.01 and $${maxAllowableAmount.toFixed(2)}.`,
  });
  if (!isAmountValid) {
    reasons.push(
      requested <= 0
        ? "Refund amount must be greater than zero."
        : `Requested amount exceeds refundable balance ($${maxAllowableAmount.toFixed(2)}). Shipping charges are non-refundable.`
    );
  }

  // Rule 9: CUSTOMER_CONFIRMATION - Mandatory confirmation check policy
  checks.push({
    rule: "CUSTOMER_CONFIRMATION_REQUIRED",
    passed: true,
    message: "Refund requires explicit customer confirmation before final disbursement.",
  });

  // Final evaluation: All mandatory checks must pass
  const eligible = checks.every((c) => c.passed);
  const refundAmount = eligible ? Math.round(requested * 100) / 100 : 0;

  return {
    eligible,
    checks,
    reasons,
    refundAmount,
    requiresConfirmation: true,
  };
}
