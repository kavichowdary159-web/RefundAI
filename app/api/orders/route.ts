import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
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
      orderBy: {
        id: "asc",
      },
    });

    const demoOrderTags: Record<string, { label: string; type: "eligible" | "expired" | "refunded" | "clearance" | "fraud" | "transit" }> = {
      "ORD-ELIGIBLE-101": { label: "Scenario 1: Eligible Refund", type: "eligible" },
      "ORD-EXPIRED-102": { label: "Scenario 2: Expired 30-Day Window", type: "expired" },
      "ORD-REFUNDED-103": { label: "Scenario 3: Already Refunded", type: "refunded" },
      "ORD-CLEARANCE-104": { label: "Scenario 4: Clearance / Final Sale", type: "clearance" },
      "ORD-FRAUD-105": { label: "Scenario 5: Fraud Flagged", type: "fraud" },
      "ORD-NOT-DELIVERED-106": { label: "Scenario 6: In Transit / Not Delivered", type: "transit" },
    };

    const formatted = orders.map((order) => {
      const scenario = demoOrderTags[order.id];
      return {
        id: order.id,
        customerId: order.customerId,
        customerName: order.customer.name,
        customerEmail: order.customer.email,
        productName: order.productName,
        productCategory: order.productCategory,
        amount: order.amount,
        orderDate: order.orderDate,
        deliveryDate: order.deliveryDate,
        status: order.status,
        refundStatus: order.refundStatus,
        isClearanceItem: order.isClearanceItem,
        isFraudulent: order.isFraudulent,
        refund: order.refund,
        isScenarioOrder: Boolean(scenario),
        scenarioTag: scenario?.label,
        scenarioType: scenario?.type,
      };
    });

    return NextResponse.json({
      success: true,
      orders: formatted,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch orders from database",
      },
      { status: 500 }
    );
  }
}
