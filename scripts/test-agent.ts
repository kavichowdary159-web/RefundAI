import { processAgentMessage, clearSession } from "../lib/agent";
import { prisma } from "../lib/prisma";

async function runAgentTests() {
  console.log("=================================================");
  console.log("  AI CUSTOMER SUPPORT AGENT — TEST SUITE");
  console.log("=================================================\n");

  let allPassed = true;

  // --------------------------------------------------------------------------
  // TEST 1 — Successful eligibility check (No refund processed)
  // --------------------------------------------------------------------------
  console.log("--- TEST 1: Successful Eligibility Check (ORD-ELIGIBLE-101) ---");
  const session1 = `test_session_1_${Date.now()}`;
  clearSession(session1);

  const t1Res = await processAgentMessage({
    sessionId: session1,
    customerId: "cust_001",
    message: "I want a refund for ORD-ELIGIBLE-101",
  });

  const t1MentionsEligible = /eligible/i.test(t1Res.message);
  const t1MentionsAmount = /399\.99/i.test(t1Res.message);
  const t1AsksConfirmation = /process the refund|would you like/i.test(t1Res.message);

  // Check DB to ensure NO refund was created yet
  const order1AfterT1 = await prisma.order.findUnique({
    where: { id: "ORD-ELIGIBLE-101" },
    include: { refund: true },
  });
  const t1DbUntouched =
    order1AfterT1?.refundStatus === "NOT_REQUESTED" && order1AfterT1?.refund === null;

  const t1Passed =
    t1Res.success &&
    t1MentionsEligible &&
    t1MentionsAmount &&
    t1AsksConfirmation &&
    t1DbUntouched;

  if (!t1Passed) allPassed = false;

  console.log(`Agent reply:\n"${t1Res.message}"\n`);
  console.log(`- Mentions eligible:        ${t1MentionsEligible ? "✅" : "❌"}`);
  console.log(`- Mentions refund amount:    ${t1MentionsAmount ? "✅ ($399.99)" : "❌"}`);
  console.log(`- Requests confirmation:     ${t1AsksConfirmation ? "✅" : "❌"}`);
  console.log(`- DB not refunded yet:       ${t1DbUntouched ? "✅ (NOT_REQUESTED)" : "❌"}`);
  console.log(`Test 1 Status:               ${t1Passed ? "✅ PASS" : "❌ FAIL"}\n`);

  // --------------------------------------------------------------------------
  // TEST 2 — Explicit confirmation (Multi-turn conversation)
  // --------------------------------------------------------------------------
  console.log("--- TEST 2: Multi-turn Explicit Confirmation ---");
  const session2 = `test_session_2_${Date.now()}`;
  clearSession(session2);

  // Turn 1: Ask for refund
  const t2Turn1 = await processAgentMessage({
    sessionId: session2,
    customerId: "cust_001",
    message: "I want a refund for ORD-ELIGIBLE-101",
  });
  console.log(`Customer: "I want a refund for ORD-ELIGIBLE-101"`);
  console.log(`Agent: "${t2Turn1.message}"\n`);

  // Turn 2: Give explicit confirmation
  const t2Turn2 = await processAgentMessage({
    sessionId: session2,
    customerId: "cust_001",
    message: "Yes, please process it.",
  });
  console.log(`Customer: "Yes, please process it."`);
  console.log(`Agent: "${t2Turn2.message}"\n`);

  const t2Confirmed =
    t2Turn2.success &&
    /successfully processed|refund id|refund of \$399\.99/i.test(t2Turn2.message);

  // Check DB: verify refund was created in test turn
  const order1AfterT2 = await prisma.order.findUnique({
    where: { id: "ORD-ELIGIBLE-101" },
    include: { refund: true },
  });
  const t2RefundCreated =
    order1AfterT2?.refundStatus === "COMPLETED" && order1AfterT2?.refund !== null;

  const t2Passed = t2Confirmed && t2RefundCreated;
  if (!t2Passed) allPassed = false;

  console.log(`- Refund successfully created in DB: ${t2RefundCreated ? "✅" : "❌"}`);
  console.log(`Test 2 Status:                      ${t2Passed ? "✅ PASS" : "❌ FAIL"}\n`);

  // RESTORE / CLEANUP ORD-ELIGIBLE-101 so it remains available for the Loom demo
  console.log("Restoring ORD-ELIGIBLE-101 to unrefunded state for Loom demo...");
  if (order1AfterT2?.refund) {
    await prisma.refund.delete({ where: { id: order1AfterT2.refund.id } });
  }
  await prisma.order.update({
    where: { id: "ORD-ELIGIBLE-101" },
    data: { refundStatus: "NOT_REQUESTED" },
  });
  console.log("✅ ORD-ELIGIBLE-101 successfully restored to NOT_REQUESTED.\n");

  // --------------------------------------------------------------------------
  // TEST 3 — Expired refund (ORD-EXPIRED-102)
  // --------------------------------------------------------------------------
  console.log("--- TEST 3: Expired Refund (ORD-EXPIRED-102) ---");
  const session3 = `test_session_3_${Date.now()}`;
  clearSession(session3);

  const t3Res = await processAgentMessage({
    sessionId: session3,
    customerId: "cust_002",
    message: "I want a refund for ORD-EXPIRED-102",
  });

  const t3Denied =
    t3Res.success &&
    /not eligible|expired|30 days/i.test(t3Res.message) &&
    !/would you like me to process/i.test(t3Res.message);

  if (!t3Denied) allPassed = false;
  console.log(`Agent reply:\n"${t3Res.message}"`);
  console.log(`Test 3 Status: ${t3Denied ? "✅ PASS (DENIED as expected)" : "❌ FAIL"}\n`);

  // --------------------------------------------------------------------------
  // TEST 4 — Already refunded (ORD-REFUNDED-103)
  // --------------------------------------------------------------------------
  console.log("--- TEST 4: Already Refunded (ORD-REFUNDED-103) ---");
  const session4 = `test_session_4_${Date.now()}`;
  clearSession(session4);

  const t4Res = await processAgentMessage({
    sessionId: session4,
    customerId: "cust_003",
    message: "I want a refund for ORD-REFUNDED-103",
  });

  const t4Denied =
    t4Res.success &&
    /not eligible|already.*refunded/i.test(t4Res.message) &&
    !/would you like me to process/i.test(t4Res.message);

  if (!t4Denied) allPassed = false;
  console.log(`Agent reply:\n"${t4Res.message}"`);
  console.log(`Test 4 Status: ${t4Denied ? "✅ PASS (DENIED as expected)" : "❌ FAIL"}\n`);

  // --------------------------------------------------------------------------
  // TEST 5 — Clearance product (ORD-CLEARANCE-104)
  // --------------------------------------------------------------------------
  console.log("--- TEST 5: Clearance Product (ORD-CLEARANCE-104) ---");
  const session5 = `test_session_5_${Date.now()}`;
  clearSession(session5);

  const t5Res = await processAgentMessage({
    sessionId: session5,
    customerId: "cust_004",
    message: "I want a refund for ORD-CLEARANCE-104",
  });

  const t5Denied =
    t5Res.success &&
    /not eligible|clearance|final[- ]sale/i.test(t5Res.message) &&
    !/would you like me to process/i.test(t5Res.message);

  if (!t5Denied) allPassed = false;
  console.log(`Agent reply:\n"${t5Res.message}"`);
  console.log(`Test 5 Status: ${t5Denied ? "✅ PASS (DENIED as expected)" : "❌ FAIL"}\n`);

  // --------------------------------------------------------------------------
  // TEST 6 — Fraudulent order (ORD-FRAUD-105)
  // --------------------------------------------------------------------------
  console.log("--- TEST 6: Fraudulent Order (ORD-FRAUD-105) ---");
  const session6 = `test_session_6_${Date.now()}`;
  clearSession(session6);

  const t6Res = await processAgentMessage({
    sessionId: session6,
    customerId: "cust_005",
    message: "I want a refund for ORD-FRAUD-105",
  });

  const t6Denied =
    t6Res.success &&
    /not eligible|fraud/i.test(t6Res.message) &&
    !/would you like me to process/i.test(t6Res.message);

  if (!t6Denied) allPassed = false;
  console.log(`Agent reply:\n"${t6Res.message}"`);
  console.log(`Test 6 Status: ${t6Denied ? "✅ PASS (DENIED as expected)" : "❌ FAIL"}\n`);

  // --------------------------------------------------------------------------
  // TEST 7 — Not delivered (ORD-NOT-DELIVERED-106)
  // --------------------------------------------------------------------------
  console.log("--- TEST 7: Not Delivered (ORD-NOT-DELIVERED-106) ---");
  const session7 = `test_session_7_${Date.now()}`;
  clearSession(session7);

  const t7Res = await processAgentMessage({
    sessionId: session7,
    customerId: "cust_006",
    message: "I want a refund for ORD-NOT-DELIVERED-106",
  });

  const t7Denied =
    t7Res.success &&
    /not eligible|not.*delivered|shipped/i.test(t7Res.message) &&
    !/would you like me to process/i.test(t7Res.message);

  if (!t7Denied) allPassed = false;
  console.log(`Agent reply:\n"${t7Res.message}"`);
  console.log(`Test 7 Status: ${t7Denied ? "✅ PASS (DENIED as expected)" : "❌ FAIL"}\n`);

  // --------------------------------------------------------------------------
  // FINAL DATABASE VERIFICATION
  // --------------------------------------------------------------------------
  console.log("--- FINAL DATABASE INTEGRITY CHECK ---");
  const customerCount = await prisma.customer.count();
  const orderCount = await prisma.order.count();
  const refundCount = await prisma.refund.count();

  const eligibleOrderFinal = await prisma.order.findUnique({
    where: { id: "ORD-ELIGIBLE-101" },
    include: { refund: true },
  });

  console.log(`Total Customers: ${customerCount} (Expected: 15)`);
  console.log(`Total Orders:    ${orderCount} (Expected: 15)`);
  console.log(`Total Refunds:   ${refundCount} (Expected: 1)`);
  console.log(
    `ORD-ELIGIBLE-101 status: ${eligibleOrderFinal?.refundStatus}, refund: ${eligibleOrderFinal?.refund ? "EXISTS" : "NONE"}`
  );

  const finalCheckPass =
    customerCount === 15 &&
    orderCount === 15 &&
    refundCount === 1 &&
    eligibleOrderFinal?.refundStatus === "NOT_REQUESTED" &&
    eligibleOrderFinal?.refund === null;

  if (!finalCheckPass) allPassed = false;

  console.log(`Loom Demo Preservation: ${finalCheckPass ? "✅ PASS (ORD-ELIGIBLE-101 UNREFUNDED)" : "❌ FAIL"}\n`);

  console.log("=================================================");
  console.log(`OVERALL AGENT TEST RESULT: ${allPassed ? "ALL 7 TESTS PASSED ✅" : "SOME TESTS FAILED ❌"}`);
  console.log("=================================================");

  await prisma.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runAgentTests().catch((e) => {
  console.error("Agent test runner failed:", e);
  process.exit(1);
});
