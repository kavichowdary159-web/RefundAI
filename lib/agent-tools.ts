import { z } from "zod";
import { prisma } from "./prisma";
import {
  checkRefundEligibility as evaluateRefundPolicy,
  RefundEligibilityResult,
} from "./refund-policy";
import { RefundStatus, AgentLogStatus, OrderStatus } from "@prisma/client";

// ============================================================================
// ERROR TYPES & CONSTANTS
// ============================================================================

export const ToolErrorCodes = {
  CUSTOMER_NOT_FOUND: "CUSTOMER_NOT_FOUND",
  ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
  ORDER_CUSTOMER_MISMATCH: "ORDER_CUSTOMER_MISMATCH",
  POLICY_DENIED: "POLICY_DENIED",
  CONFIRMATION_REQUIRED: "CONFIRMATION_REQUIRED",
  ALREADY_REFUNDED: "ALREADY_REFUNDED",
  INVALID_INPUT: "INVALID_INPUT",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ToolErrorCode = (typeof ToolErrorCodes)[keyof typeof ToolErrorCodes];

export interface ToolErrorResponse {
  success: false;
  error: {
    code: ToolErrorCode | string;
    message: string;
    details?: unknown;
  };
}

// ============================================================================
// 1. TOOL: lookupCustomer
// ============================================================================

export const LookupCustomerSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

export type LookupCustomerInput = z.infer<typeof LookupCustomerSchema>;

export interface LookupCustomerSuccessResponse {
  success: true;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: Date;
  };
}

export type LookupCustomerResponse = LookupCustomerSuccessResponse | ToolErrorResponse;

export async function lookupCustomer(input: unknown): Promise<LookupCustomerResponse> {
  const parsed = LookupCustomerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.INVALID_INPUT,
        message: "Invalid input for lookupCustomer.",
        details: parsed.error.format(),
      },
    };
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.CUSTOMER_NOT_FOUND,
          message: `Customer with ID '${parsed.data.customerId}' was not found.`,
        },
      };
    }

    return {
      success: true,
      customer,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.DATABASE_ERROR,
        message: "An error occurred while looking up customer.",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ============================================================================
// 2. TOOL: lookupOrder
// ============================================================================

export const LookupOrderSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
});

export type LookupOrderInput = z.infer<typeof LookupOrderSchema>;

export interface LookupOrderSuccessResponse {
  success: true;
  order: {
    id: string;
    customerId: string;
    productName: string;
    productCategory: string;
    amount: number;
    orderDate: Date;
    deliveryDate: Date | null;
    status: OrderStatus;
    refundStatus: RefundStatus;
    isClearanceItem: boolean;
    isFraudulent: boolean;
    createdAt: Date;
    customer: {
      id: string;
      name: string;
      email: string;
      phone: string | null;
    };
    refund: {
      id: string;
      amount: number;
      status: RefundStatus;
      reason: string;
      createdAt: Date;
    } | null;
  };
}

export type LookupOrderResponse = LookupOrderSuccessResponse | ToolErrorResponse;

export async function lookupOrder(input: unknown): Promise<LookupOrderResponse> {
  const parsed = LookupOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.INVALID_INPUT,
        message: "Invalid input for lookupOrder.",
        details: parsed.error.format(),
      },
    };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        refund: {
          select: {
            id: true,
            amount: true,
            status: true,
            reason: true,
            createdAt: true,
          },
        },
      },
    });

    if (!order) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ORDER_NOT_FOUND,
          message: `Order with ID '${parsed.data.orderId}' was not found.`,
        },
      };
    }

    return {
      success: true,
      order,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.DATABASE_ERROR,
        message: "An error occurred while looking up order.",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ============================================================================
// 3. TOOL: getCustomerOrders
// ============================================================================

export const GetCustomerOrdersSchema = z.object({
  customerId: z.string().min(1, "Customer ID is required"),
});

export type GetCustomerOrdersInput = z.infer<typeof GetCustomerOrdersSchema>;

export interface GetCustomerOrdersSuccessResponse {
  success: true;
  customerId: string;
  orderCount: number;
  orders: Array<{
    id: string;
    productName: string;
    productCategory: string;
    amount: number;
    orderDate: Date;
    deliveryDate: Date | null;
    status: OrderStatus;
    refundStatus: RefundStatus;
    isClearanceItem: boolean;
    isFraudulent: boolean;
    refund: {
      id: string;
      status: RefundStatus;
      amount: number;
    } | null;
  }>;
}

export type GetCustomerOrdersResponse = GetCustomerOrdersSuccessResponse | ToolErrorResponse;

export async function getCustomerOrders(input: unknown): Promise<GetCustomerOrdersResponse> {
  const parsed = GetCustomerOrdersSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.INVALID_INPUT,
        message: "Invalid input for getCustomerOrders.",
        details: parsed.error.format(),
      },
    };
  }

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parsed.data.customerId },
      select: { id: true },
    });

    if (!customer) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.CUSTOMER_NOT_FOUND,
          message: `Customer with ID '${parsed.data.customerId}' was not found.`,
        },
      };
    }

    const orders = await prisma.order.findMany({
      where: { customerId: parsed.data.customerId },
      select: {
        id: true,
        productName: true,
        productCategory: true,
        amount: true,
        orderDate: true,
        deliveryDate: true,
        status: true,
        refundStatus: true,
        isClearanceItem: true,
        isFraudulent: true,
        refund: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { orderDate: "desc" },
    });

    return {
      success: true,
      customerId: parsed.data.customerId,
      orderCount: orders.length,
      orders,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.DATABASE_ERROR,
        message: "An error occurred while retrieving customer orders.",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ============================================================================
// 4. TOOL: checkRefundEligibility
// ============================================================================

export const CheckRefundEligibilityToolSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  customerId: z.string().optional(),
});

export type CheckRefundEligibilityToolInput = z.infer<typeof CheckRefundEligibilityToolSchema>;

export interface CheckRefundEligibilityToolSuccessResponse {
  success: true;
  orderId: string;
  customerId: string;
  eligible: boolean;
  refundAmount: number;
  checks: RefundEligibilityResult["checks"];
  reasons: string[];
  requiresConfirmation: boolean;
}

export type CheckRefundEligibilityToolResponse =
  | CheckRefundEligibilityToolSuccessResponse
  | ToolErrorResponse;

export async function checkRefundEligibility(
  input: unknown
): Promise<CheckRefundEligibilityToolResponse> {
  const parsed = CheckRefundEligibilityToolSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.INVALID_INPUT,
        message: "Invalid input for checkRefundEligibility.",
        details: parsed.error.format(),
      },
    };
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        customer: true,
        refund: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ORDER_NOT_FOUND,
          message: `Order with ID '${parsed.data.orderId}' was not found.`,
        },
      };
    }

    if (parsed.data.customerId && order.customerId !== parsed.data.customerId) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ORDER_CUSTOMER_MISMATCH,
          message: `Order '${parsed.data.orderId}' does not belong to customer '${parsed.data.customerId}'.`,
        },
      };
    }

    // Call deterministic policy engine (single source of truth)
    const evaluation = evaluateRefundPolicy(order, order.customer);

    return {
      success: true,
      orderId: order.id,
      customerId: order.customer.id,
      eligible: evaluation.eligible,
      refundAmount: evaluation.refundAmount,
      checks: evaluation.checks,
      reasons: evaluation.reasons,
      requiresConfirmation: evaluation.requiresConfirmation,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.DATABASE_ERROR,
        message: "An error occurred while evaluating refund eligibility.",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ============================================================================
// 5. TOOL: processRefund
// ============================================================================

export const ProcessRefundSchema = z.object({
  orderId: z.string().min(1, "Order ID is required"),
  customerId: z.string().min(1, "Customer ID is required"),
  customerConfirmation: z
    .boolean()
    .refine((val) => val !== undefined && val !== null, {
      message: "customerConfirmation is required and must be a boolean",
    }),
  reason: z.string().optional(),
});

export type ProcessRefundInput = z.infer<typeof ProcessRefundSchema>;

export interface ProcessRefundSuccessResponse {
  success: true;
  refundId: string;
  orderId: string;
  amount: number;
  status: RefundStatus;
  processedAt: Date;
}

export type ProcessRefundResponse = ProcessRefundSuccessResponse | ToolErrorResponse;

/**
 * Highly secure, deterministic refund execution tool.
 *
 * Enforces:
 * 1. Zod input validation
 * 2. Customer and order existence
 * 3. Ownership matching
 * 4. Explicit customerConfirmation === true
 * 5. Deterministic policy re-evaluation (never trusts LLM)
 * 6. Duplicate prevention via transactional check
 * 7. Atomically creates Refund and updates Order.refundStatus
 */
export async function processRefund(input: unknown): Promise<ProcessRefundResponse> {
  const parsed = ProcessRefundSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.INVALID_INPUT,
        message: "Invalid input for processRefund.",
        details: parsed.error.format(),
      },
    };
  }

  const { orderId, customerId, customerConfirmation, reason } = parsed.data;

  // 1. Customer confirmation guard
  if (customerConfirmation !== true) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.CONFIRMATION_REQUIRED,
        message: "Refund denied: Customer has not explicitly confirmed the refund request.",
      },
    };
  }

  try {
    // 2. Fetch customer
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.CUSTOMER_NOT_FOUND,
          message: `Customer with ID '${customerId}' was not found.`,
        },
      };
    }

    // 3. Fetch order with current refund record
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { refund: true, customer: true },
    });
    if (!order) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ORDER_NOT_FOUND,
          message: `Order with ID '${orderId}' was not found.`,
        },
      };
    }

    // 4. Verify ownership
    if (order.customerId !== customerId) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ORDER_CUSTOMER_MISMATCH,
          message: `Order '${orderId}' does not belong to customer '${customerId}'.`,
        },
      };
    }

    // 5. Pre-check for duplicate completed refund
    if (
      order.refundStatus === RefundStatus.COMPLETED ||
      order.refund?.status === RefundStatus.COMPLETED
    ) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ALREADY_REFUNDED,
          message: `Order '${orderId}' has already been refunded (Refund ID: ${order.refund?.id ?? "Recorded"}).`,
        },
      };
    }

    // 6. Independently re-evaluate eligibility using deterministic policy engine
    const evaluation = evaluateRefundPolicy(order, customer);
    if (!evaluation.eligible) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.POLICY_DENIED,
          message: `Refund rejected by policy engine: ${evaluation.reasons.join(" | ")}`,
          details: {
            checks: evaluation.checks,
            reasons: evaluation.reasons,
          },
        },
      };
    }

    const finalRefundAmount = evaluation.refundAmount;

    // 7. Atomic database transaction to prevent duplicate processing / race conditions
    const createdRefund = await prisma.$transaction(async (tx) => {
      // Re-verify inside transaction
      const lockedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { refund: true },
      });

      if (!lockedOrder) {
        throw new Error(ToolErrorCodes.ORDER_NOT_FOUND);
      }

      if (
        lockedOrder.refundStatus === RefundStatus.COMPLETED ||
        lockedOrder.refund?.status === RefundStatus.COMPLETED
      ) {
        throw new Error(ToolErrorCodes.ALREADY_REFUNDED);
      }

      const newRefund = await tx.refund.create({
        data: {
          orderId: lockedOrder.id,
          customerId: customer.id,
          amount: finalRefundAmount,
          status: RefundStatus.COMPLETED,
          reason: reason || "Customer confirmed refund request processed by support tool",
        },
      });

      await tx.order.update({
        where: { id: lockedOrder.id },
        data: {
          refundStatus: RefundStatus.COMPLETED,
        },
      });

      return newRefund;
    });

    return {
      success: true,
      refundId: createdRefund.id,
      orderId: createdRefund.orderId,
      amount: createdRefund.amount,
      status: createdRefund.status,
      processedAt: createdRefund.createdAt,
    };
  } catch (error) {
    if (error instanceof Error && error.message === ToolErrorCodes.ALREADY_REFUNDED) {
      return {
        success: false,
        error: {
          code: ToolErrorCodes.ALREADY_REFUNDED,
          message: `Order '${orderId}' has already been refunded.`,
        },
      };
    }

    return {
      success: false,
      error: {
        code: ToolErrorCodes.DATABASE_ERROR,
        message: "An error occurred during refund processing.",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}

// ============================================================================
// 6. TOOL: createAgentLog
// ============================================================================

export const CreateAgentLogSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  eventType: z.string().min(1, "Event type is required"),
  toolName: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  status: z.string().min(1, "Status is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateAgentLogInput = z.infer<typeof CreateAgentLogSchema>;

export interface CreateAgentLogSuccessResponse {
  success: true;
  logId: string;
  createdAt: Date;
}

export type CreateAgentLogResponse = CreateAgentLogSuccessResponse | ToolErrorResponse;

function mapAgentLogStatus(statusStr: string): AgentLogStatus {
  const upper = statusStr.toUpperCase();
  if (upper === "SUCCESS") return AgentLogStatus.SUCCESS;
  if (upper === "WARNING") return AgentLogStatus.WARNING;
  if (upper === "ERROR" || upper === "FAILED") return AgentLogStatus.ERROR;
  return AgentLogStatus.INFO;
}

export async function createAgentLog(input: unknown): Promise<CreateAgentLogResponse> {
  const parsed = CreateAgentLogSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.INVALID_INPUT,
        message: "Invalid input for createAgentLog.",
        details: parsed.error.format(),
      },
    };
  }

  try {
    const { sessionId, eventType, toolName, message, status, metadata } = parsed.data;

    const log = await prisma.agentLog.create({
      data: {
        sessionId,
        eventType,
        toolName: toolName ?? null,
        message,
        status: mapAgentLogStatus(status),
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return {
      success: true,
      logId: log.id,
      createdAt: log.createdAt,
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: ToolErrorCodes.DATABASE_ERROR,
        message: "An error occurred while creating agent log.",
        details: error instanceof Error ? error.message : String(error),
      },
    };
  }
}
