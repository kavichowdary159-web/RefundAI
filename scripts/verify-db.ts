import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function verify() {
  console.log("--- DATABASE VERIFICATION REPORT ---");

  const customerCount = await prisma.customer.count();
  const orderCount = await prisma.order.count();
  const refundCount = await prisma.refund.count();
  const agentLogCount = await prisma.agentLog.count();

  console.log(`Total Customers: ${customerCount}`);
  console.log(`Total Orders: ${orderCount}`);
  console.log(`Total Refunds: ${refundCount}`);
  console.log(`Total AgentLogs: ${agentLogCount}`);

  // Fetch the 6 scenario orders
  const scenarios = [
    { label: "1. Eligible Refund", id: "ORD-ELIGIBLE-101" },
    { label: "2. Expired Refund", id: "ORD-EXPIRED-102" },
    { label: "3. Already Refunded", id: "ORD-REFUNDED-103" },
    { label: "4. Clearance Product", id: "ORD-CLEARANCE-104" },
    { label: "5. Fraudulent Order", id: "ORD-FRAUD-105" },
    { label: "6. Not Delivered", id: "ORD-NOT-DELIVERED-106" },
  ];

  console.log("\n--- SCENARIO VERIFICATION ---");
  for (const s of scenarios) {
    const order = await prisma.order.findUnique({
      where: { id: s.id },
      include: { customer: true, refund: true },
    });
    if (!order) {
      console.error(`FAILED: Order ${s.id} not found!`);
      continue;
    }
    console.log(`[${s.label}]`);
    console.log(`  Order ID: ${order.id}`);
    console.log(`  Customer: ${order.customer.name} (${order.customer.email})`);
    console.log(`  Product: ${order.productName} ($${order.amount.toFixed(2)})`);
    console.log(`  Order Date: ${order.orderDate.toISOString().split("T")[0]}`);
    console.log(`  Delivery Date: ${order.deliveryDate ? order.deliveryDate.toISOString().split("T")[0] : "None (In Transit)"}`);
    console.log(`  Status: ${order.status}`);
    console.log(`  Refund Status: ${order.refundStatus}`);
    console.log(`  isClearanceItem: ${order.isClearanceItem}`);
    console.log(`  isFraudulent: ${order.isFraudulent}`);
    console.log(`  Refund Record: ${order.refund ? `ID: ${order.refund.id}, Status: ${order.refund.status}, Amount: $${order.refund.amount}` : "None"}`);
    console.log("");
  }

  await prisma.$disconnect();
}

verify().catch((e) => {
  console.error("Verification failed:", e);
  process.exit(1);
});
