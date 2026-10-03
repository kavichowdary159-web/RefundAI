import { checkRefundEligibility } from "../lib/refund-policy";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

interface TestScenario {
  orderId: string;
  expectedEligible: boolean;
  expectedReasonSubstring?: string;
  description: string;
}

const scenarios: TestScenario[] = [
  {
    orderId: "ORD-ELIGIBLE-101",
    expectedEligible: true,
    description: "Scenario 1: Delivered recently, standard item, non-fraudulent, no prior refund",
  },
  {
    orderId: "ORD-EXPIRED-102",
    expectedEligible: false,
    expectedReasonSubstring: "Refund window has expired",
    description: "Scenario 2: Delivered > 30 calendar days ago",
  },
  {
    orderId: "ORD-REFUNDED-103",
    expectedEligible: false,
    expectedReasonSubstring: "already been refunded",
    description: "Scenario 3: Order already refunded",
  },
  {
    orderId: "ORD-CLEARANCE-104",
    expectedEligible: false,
    expectedReasonSubstring: "Clearance and final-sale",
    description: "Scenario 4: Clearance/final-sale product",
  },
  {
    orderId: "ORD-FRAUD-105",
    expectedEligible: false,
    expectedReasonSubstring: "fraudulent",
    description: "Scenario 5: Marked fraudulent",
  },
  {
    orderId: "ORD-NOT-DELIVERED-106",
    expectedEligible: false,
    expectedReasonSubstring: "not been delivered",
    description: "Scenario 6: Order not delivered (SHIPPED status)",
  },
];

async function runTests() {
  console.log("=================================================");
  console.log("  STRICT REFUND POLICY ENGINE — TEST RUNNER");
  console.log("=================================================\n");

  let allPassed = true;
  let scenarioIndex = 1;

  for (const s of scenarios) {
    const order = await prisma.order.findUnique({
      where: { id: s.orderId },
      include: { customer: true, refund: true },
    });

    if (!order) {
      console.error(`❌ ERROR: Seed order ${s.orderId} not found in database!`);
      allPassed = false;
      continue;
    }

    const result = checkRefundEligibility(order, order.customer);
    const passed =
      result.eligible === s.expectedEligible &&
      (!s.expectedReasonSubstring ||
        result.reasons.some((r) => r.toLowerCase().includes(s.expectedReasonSubstring!.toLowerCase())));

    if (!passed) {
      allPassed = false;
    }

    console.log(`[TEST ${scenarioIndex}] ${s.orderId} — ${s.description}`);
    console.log(`  Customer:       ${order.customer.name} (${order.customer.email})`);
    console.log(`  Product:        ${order.productName} ($${order.amount.toFixed(2)})`);
    console.log(`  Result:         ${result.eligible ? "ELIGIBLE" : "DENIED"}`);
    console.log(`  Expected:       ${s.expectedEligible ? "ELIGIBLE" : "DENIED"}`);
    console.log(`  Refund Amount:  $${result.refundAmount.toFixed(2)}`);
    if (result.reasons.length > 0) {
      console.log(`  Denial Reasons: ${result.reasons.join(" | ")}`);
    }
    console.log(`  Failed Checks:  ${result.checks.filter((c) => !c.passed).map((c) => c.rule).join(", ") || "None (All Passed)"}`);
    console.log(`  Status:         ${passed ? "✅ PASS" : "❌ FAIL"}\n`);

    scenarioIndex++;
  }

  // Unit edge-case tests
  console.log("-------------------------------------------------");
  console.log("  ADDITIONAL EDGE CASE TESTS");
  console.log("-------------------------------------------------");

  // Edge Case 1: Missing entities
  const nullResult = checkRefundEligibility(null, null);
  const nullPassed = !nullResult.eligible && nullResult.refundAmount === 0;
  console.log(`[EDGE 1] Null entities: ${nullPassed ? "✅ PASS" : "❌ FAIL"}`);

  // Edge Case 2: Excessive amount requested
  const sampleOrder = await prisma.order.findUnique({
    where: { id: "ORD-ELIGIBLE-101" },
    include: { customer: true, refund: true },
  });
  if (sampleOrder) {
    const excessiveResult = checkRefundEligibility(sampleOrder, sampleOrder.customer, {
      requestedAmount: sampleOrder.amount + 50,
    });
    const excessivePassed = !excessiveResult.eligible && excessiveResult.refundAmount === 0;
    console.log(`[EDGE 2] Excessive refund amount: ${excessivePassed ? "✅ PASS" : "❌ FAIL"}`);

    // Edge Case 3: Negative amount requested
    const negativeResult = checkRefundEligibility(sampleOrder, sampleOrder.customer, {
      requestedAmount: -10,
    });
    const negativePassed = !negativeResult.eligible && negativeResult.refundAmount === 0;
    console.log(`[EDGE 3] Negative refund amount: ${negativePassed ? "✅ PASS" : "❌ FAIL"}`);

    // Edge Case 4: Non-refundable shipping deduction
    const shippingResult = checkRefundEligibility(sampleOrder, sampleOrder.customer, {
      shippingAmount: 15.0,
    });
    const shippingPassed =
      shippingResult.eligible &&
      shippingResult.refundAmount === sampleOrder.amount - 15.0;
    console.log(`[EDGE 4] Non-refundable shipping deduction: ${shippingPassed ? "✅ PASS" : "❌ FAIL"} (Refund: $${shippingResult.refundAmount})`);

    if (!nullPassed || !excessivePassed || !negativePassed || !shippingPassed) {
      allPassed = false;
    }
  }

  console.log("\n=================================================");
  console.log(`OVERALL RESULT: ${allPassed ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
  console.log("=================================================");

  await prisma.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
