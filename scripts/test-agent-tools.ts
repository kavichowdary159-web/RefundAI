import {
  lookupCustomer,
  lookupOrder,
  getCustomerOrders,
  checkRefundEligibility,
  processRefund,
  createAgentLog,
  ToolErrorCodes,
} from "../lib/agent-tools";
import { prisma } from "../lib/prisma";

async function runToolTests() {
  console.log("=================================================");
  console.log("  AGENT TOOL LAYER — COMPREHENSIVE TEST SUITE");
  console.log("=================================================\n");

  let allPassed = true;

  // Record initial database state
  const initialCustomerCount = await prisma.customer.count();
  const initialOrderCount = await prisma.order.count();
  const initialRefundCount = await prisma.refund.count();

  // --------------------------------------------------------------------------
  // A. lookupCustomer
  // --------------------------------------------------------------------------
  console.log("--- TEST SUITE A: lookupCustomer ---");

  // Valid customer
  const validCustomerRes = await lookupCustomer({ customerId: "cust_001" });
  const a1Pass =
    validCustomerRes.success &&
    validCustomerRes.customer.id === "cust_001" &&
    validCustomerRes.customer.name === "Alice Smith";
  console.log(
    `[A.1] Valid customer (cust_001): ${a1Pass ? "✅ PASS" : "❌ FAIL"}`,
    validCustomerRes.success ? `(${validCustomerRes.customer.name})` : validCustomerRes.error
  );

  // Invalid customer
  const invalidCustomerRes = await lookupCustomer({ customerId: "non_existent_999" });
  const a2Pass =
    !invalidCustomerRes.success &&
    invalidCustomerRes.error.code === ToolErrorCodes.CUSTOMER_NOT_FOUND;
  console.log(
    `[A.2] Invalid customer: ${a2Pass ? "✅ PASS" : "❌ FAIL"} (Code: ${!invalidCustomerRes.success ? invalidCustomerRes.error.code : "N/A"})`
  );

  if (!a1Pass || !a2Pass) allPassed = false;

  // --------------------------------------------------------------------------
  // B. lookupOrder
  // --------------------------------------------------------------------------
  console.log("\n--- TEST SUITE B: lookupOrder ---");

  // Valid order: ORD-ELIGIBLE-101
  const validOrderRes = await lookupOrder({ orderId: "ORD-ELIGIBLE-101" });
  const b1Pass =
    validOrderRes.success &&
    validOrderRes.order.id === "ORD-ELIGIBLE-101" &&
    validOrderRes.order.customer.id === "cust_001" &&
    validOrderRes.order.productName.includes("Sony");
  console.log(
    `[B.1] Valid order (ORD-ELIGIBLE-101): ${b1Pass ? "✅ PASS" : "❌ FAIL"}`,
    validOrderRes.success
      ? `(${validOrderRes.order.productName}, Customer: ${validOrderRes.order.customer.name})`
      : validOrderRes.error
  );

  // Invalid order
  const invalidOrderRes = await lookupOrder({ orderId: "ORD-INVALID-999" });
  const b2Pass =
    !invalidOrderRes.success &&
    invalidOrderRes.error.code === ToolErrorCodes.ORDER_NOT_FOUND;
  console.log(
    `[B.2] Invalid order: ${b2Pass ? "✅ PASS" : "❌ FAIL"} (Code: ${!invalidOrderRes.success ? invalidOrderRes.error.code : "N/A"})`
  );

  if (!b1Pass || !b2Pass) allPassed = false;

  // --------------------------------------------------------------------------
  // C. getCustomerOrders
  // --------------------------------------------------------------------------
  console.log("\n--- TEST SUITE C: getCustomerOrders ---");

  const custOrdersRes = await getCustomerOrders({ customerId: "cust_001" });
  const c1Pass =
    custOrdersRes.success &&
    custOrdersRes.orders.length > 0 &&
    custOrdersRes.orders.some((o) => o.id === "ORD-ELIGIBLE-101");
  console.log(
    `[C.1] Orders for cust_001: ${c1Pass ? "✅ PASS" : "❌ FAIL"} (Found ${custOrdersRes.success ? custOrdersRes.orderCount : 0} order(s))`
  );

  const missingCustOrdersRes = await getCustomerOrders({ customerId: "cust_missing_999" });
  const c2Pass =
    !missingCustOrdersRes.success &&
    missingCustOrdersRes.error.code === ToolErrorCodes.CUSTOMER_NOT_FOUND;
  console.log(
    `[C.2] Orders for missing customer: ${c2Pass ? "✅ PASS" : "❌ FAIL"} (Code: ${!missingCustOrdersRes.success ? missingCustOrdersRes.error.code : "N/A"})`
  );

  if (!c1Pass || !c2Pass) allPassed = false;

  // --------------------------------------------------------------------------
  // D. checkRefundEligibility (All 6 scenarios)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST SUITE D: checkRefundEligibility ---");

  const eligibilityScenarios = [
    { orderId: "ORD-ELIGIBLE-101", expected: true, label: "Scenario 1 (Delivered recently, standard)" },
    { orderId: "ORD-EXPIRED-102", expected: false, label: "Scenario 2 (Expired > 30 days)" },
    { orderId: "ORD-REFUNDED-103", expected: false, label: "Scenario 3 (Already refunded)" },
    { orderId: "ORD-CLEARANCE-104", expected: false, label: "Scenario 4 (Clearance / final-sale)" },
    { orderId: "ORD-FRAUD-105", expected: false, label: "Scenario 5 (Fraudulent order)" },
    { orderId: "ORD-NOT-DELIVERED-106", expected: false, label: "Scenario 6 (Not delivered)" },
  ];

  for (const s of eligibilityScenarios) {
    const res = await checkRefundEligibility({ orderId: s.orderId });
    const pass = res.success && res.eligible === s.expected;
    if (!pass) allPassed = false;

    console.log(
      `[D] ${s.orderId} — ${s.label}: ${pass ? "✅ PASS" : "❌ FAIL"} ` +
        `(Result: ${res.success ? (res.eligible ? "ELIGIBLE" : "DENIED") : "ERROR"})`
    );
  }

  // --------------------------------------------------------------------------
  // E. processRefund (Guard & Negative Tests ONLY - NO accidental processing)
  // --------------------------------------------------------------------------
  console.log("\n--- TEST SUITE E: processRefund (Safety & Guardrails) ---");

  // 1. No confirmation (customerConfirmation = false)
  const noConfirmRes = await processRefund({
    orderId: "ORD-ELIGIBLE-101",
    customerId: "cust_001",
    customerConfirmation: false,
  });
  const e1Pass =
    !noConfirmRes.success &&
    noConfirmRes.error.code === ToolErrorCodes.CONFIRMATION_REQUIRED;
  console.log(
    `[E.1] Eligible order with customerConfirmation: false → ${e1Pass ? "✅ PASS (DENIED)" : "❌ FAIL"} (Code: ${!noConfirmRes.success ? noConfirmRes.error.code : "N/A"})`
  );

  // 2. Expired order with confirmation (ORD-EXPIRED-102)
  const expiredRes = await processRefund({
    orderId: "ORD-EXPIRED-102",
    customerId: "cust_002",
    customerConfirmation: true,
  });
  const e2Pass =
    !expiredRes.success &&
    expiredRes.error.code === ToolErrorCodes.POLICY_DENIED;
  console.log(
    `[E.2] Expired order (ORD-EXPIRED-102) with confirmation: true → ${e2Pass ? "✅ PASS (DENIED)" : "❌ FAIL"} (Code: ${!expiredRes.success ? expiredRes.error.code : "N/A"})`
  );

  // 3. Already refunded order with confirmation (ORD-REFUNDED-103)
  const alreadyRefundedRes = await processRefund({
    orderId: "ORD-REFUNDED-103",
    customerId: "cust_003",
    customerConfirmation: true,
  });
  const e3Pass =
    !alreadyRefundedRes.success &&
    alreadyRefundedRes.error.code === ToolErrorCodes.ALREADY_REFUNDED;
  console.log(
    `[E.3] Already refunded order (ORD-REFUNDED-103) with confirmation: true → ${e3Pass ? "✅ PASS (DENIED)" : "❌ FAIL"} (Code: ${!alreadyRefundedRes.success ? alreadyRefundedRes.error.code : "N/A"})`
  );

  // 4. Clearance product with confirmation (ORD-CLEARANCE-104)
  const clearanceRes = await processRefund({
    orderId: "ORD-CLEARANCE-104",
    customerId: "cust_004",
    customerConfirmation: true,
  });
  const e4Pass =
    !clearanceRes.success &&
    clearanceRes.error.code === ToolErrorCodes.POLICY_DENIED;
  console.log(
    `[E.4] Clearance order (ORD-CLEARANCE-104) with confirmation: true → ${e4Pass ? "✅ PASS (DENIED)" : "❌ FAIL"} (Code: ${!clearanceRes.success ? clearanceRes.error.code : "N/A"})`
  );

  // 5. Customer mismatch attempt (cust_002 trying to refund cust_001's order)
  const mismatchRes = await processRefund({
    orderId: "ORD-ELIGIBLE-101",
    customerId: "cust_002",
    customerConfirmation: true,
  });
  const e5Pass =
    !mismatchRes.success &&
    mismatchRes.error.code === ToolErrorCodes.ORDER_CUSTOMER_MISMATCH;
  console.log(
    `[E.5] Customer mismatch on ORD-ELIGIBLE-101 → ${e5Pass ? "✅ PASS (DENIED)" : "❌ FAIL"} (Code: ${!mismatchRes.success ? mismatchRes.error.code : "N/A"})`
  );

  if (!e1Pass || !e2Pass || !e3Pass || !e4Pass || !e5Pass) allPassed = false;

  // --------------------------------------------------------------------------
  // F. createAgentLog
  // --------------------------------------------------------------------------
  console.log("\n--- TEST SUITE F: createAgentLog ---");

  const testSessionId = `test_session_${Date.now()}`;
  const logRes = await createAgentLog({
    sessionId: testSessionId,
    eventType: "TOOL_TEST_EXECUTION",
    toolName: "test_suite_runner",
    message: "Automated agent tool test verification completed.",
    status: "SUCCESS",
    metadata: {
      testSuites: ["lookupCustomer", "lookupOrder", "getCustomerOrders", "checkRefundEligibility", "processRefund"],
      verifiedAt: new Date().toISOString(),
    },
  });

  const f1Pass = logRes.success && !!logRes.logId;
  console.log(
    `[F.1] Create agent log: ${f1Pass ? "✅ PASS" : "❌ FAIL"} (Log ID: ${logRes.success ? logRes.logId : "N/A"})`
  );

  // Verify it exists in database
  let f2Pass = false;
  if (logRes.success) {
    const fetchedLog = await prisma.agentLog.findUnique({
      where: { id: logRes.logId },
    });
    f2Pass = !!fetchedLog && fetchedLog.sessionId === testSessionId;
    console.log(
      `[F.2] Verify log persisted in SQLite: ${f2Pass ? "✅ PASS" : "❌ FAIL"} (Session: ${fetchedLog?.sessionId})`
    );
  }

  if (!f1Pass || !f2Pass) allPassed = false;

  // --------------------------------------------------------------------------
  // Final Database State Verification
  // --------------------------------------------------------------------------
  console.log("\n--- FINAL DATABASE INTEGRITY CHECK ---");
  const finalCustomerCount = await prisma.customer.count();
  const finalOrderCount = await prisma.order.count();
  const finalRefundCount = await prisma.refund.count();

  // Check ORD-ELIGIBLE-101 specifically
  const eligibleOrder = await prisma.order.findUnique({
    where: { id: "ORD-ELIGIBLE-101" },
    include: { refund: true },
  });

  const eligibleOrderUntouched =
    eligibleOrder?.refundStatus === "NOT_REQUESTED" && eligibleOrder?.refund === null;

  console.log(`Total Customers: ${finalCustomerCount} (Expected: ${initialCustomerCount})`);
  console.log(`Total Orders:    ${finalOrderCount} (Expected: ${initialOrderCount})`);
  console.log(`Total Refunds:   ${finalRefundCount} (Expected: ${initialRefundCount} - NO ACCIDENTAL REFUND)`);
  console.log(
    `ORD-ELIGIBLE-101 status: ${eligibleOrder?.refundStatus}, refund: ${eligibleOrder?.refund ? "EXISTS" : "NONE"} ` +
      `→ ${eligibleOrderUntouched ? "✅ PRESERVED FOR DEMO" : "❌ ACCIDENTALLY REFUNDED"}`
  );

  const dbIntegrityPass =
    finalCustomerCount === initialCustomerCount &&
    finalOrderCount === initialOrderCount &&
    finalRefundCount === initialRefundCount &&
    eligibleOrderUntouched;

  if (!dbIntegrityPass) allPassed = false;

  console.log("\n=================================================");
  console.log(`OVERALL TOOL TEST RESULT: ${allPassed ? "ALL TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
  console.log("=================================================");

  await prisma.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runToolTests().catch((e) => {
  console.error("Test execution failed:", e);
  process.exit(1);
});
