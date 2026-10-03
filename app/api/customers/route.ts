import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            orders: true,
            refunds: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    const formatted = customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      orderCount: c._count.orders,
      refundCount: c._count.refunds,
      status: "Active",
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      customers: formatted,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch customers from database",
      },
      { status: 500 }
    );
  }
}
