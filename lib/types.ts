export interface AgentEvent {
  eventType: string;
  toolName?: string;
  message: string;
  status: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface AgentApiResponse {
  success: boolean;
  sessionId: string;
  message: string;
  events?: AgentEvent[];
  error?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  timestamp: string;
  events?: AgentEvent[];
  isError?: boolean;
  refundCard?: {
    type: "confirmation" | "denied" | "success";
    orderId: string;
    productName?: string;
    amount?: number;
    reason?: string;
    refundId?: string;
  };
}

export interface CustomerData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  orderCount: number;
  refundCount: number;
  status: string;
  createdAt: string;
}

export interface OrderData {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  productName: string;
  productCategory: string;
  amount: number;
  orderDate: string;
  deliveryDate: string | null;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  refundStatus: "NOT_REQUESTED" | "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";
  isClearanceItem: boolean;
  isFraudulent: boolean;
  refund?: {
    id: string;
    amount: number;
    status: string;
    reason: string;
    createdAt: string;
  } | null;
  isScenarioOrder: boolean;
  scenarioTag?: string;
  scenarioType?: "eligible" | "expired" | "refunded" | "clearance" | "fraud" | "transit";
}

export interface DashboardStats {
  totalCustomers: number;
  totalOrders: number;
  refundsProcessed: number;
  totalRefundedAmount: number;
  agentStatus: string;
}

export interface DBLogItem {
  id: string;
  sessionId: string;
  eventType: string;
  toolName: string | null;
  message: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
