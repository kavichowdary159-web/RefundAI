import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [totalCustomers, totalOrders, refundsProcessedCount, refundsCompleted, recentLogs] = await Promise.all([
      prisma.customer.count(),
      prisma.order.count(),
      prisma.refund.count({
        where: {
          status: "COMPLETED",
        },
      }),
      prisma.refund.findMany({
        where: {
          status: "COMPLETED",
        },
        select: {
          amount: true,
        },
      }),
      prisma.agentLog.findMany({
        take: 100,
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const totalRefundedAmount = refundsCompleted.reduce((sum, r) => sum + r.amount, 0);

    const parsedLogs = recentLogs.map((log) => {
      let parsedMetadata: Record<string, unknown> | null = null;
      if (log.metadata) {
        try {
          parsedMetadata = JSON.parse(log.metadata);
        } catch {
          parsedMetadata = { raw: log.metadata };
        }
      }
      return {
        id: log.id,
        sessionId: log.sessionId,
        eventType: log.eventType,
        toolName: log.toolName,
        message: log.message,
        status: log.status,
        metadata: parsedMetadata,
        createdAt: log.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalCustomers,
        totalOrders,
        refundsProcessed: refundsProcessedCount,
        totalRefundedAmount,
        agentStatus: "Online",
      },
      logs: parsedLogs,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch dashboard metrics and logs",
      },
      { status: 500 }
    );
  }
}
