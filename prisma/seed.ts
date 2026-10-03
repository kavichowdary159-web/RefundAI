import { PrismaClient, OrderStatus, RefundStatus, AgentLogStatus } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.agentLog.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.order.deleteMany();
  await prisma.customer.deleteMany();

  const now = new Date();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // 1. Create Exactly 15 Customers
  const customersData = [
    { id: "cust_001", name: "Alice Smith", email: "alice.smith@example.com", phone: "+1-555-0101" },
    { id: "cust_002", name: "Bob Johnson", email: "bob.johnson@example.com", phone: "+1-555-0102" },
    { id: "cust_003", name: "Charlie Brown", email: "charlie.brown@example.com", phone: "+1-555-0103" },
    { id: "cust_004", name: "Diana Prince", email: "diana.prince@example.com", phone: "+1-555-0104" },
    { id: "cust_005", name: "Ethan Hunt", email: "ethan.hunt@example.com", phone: "+1-555-0105" },
    { id: "cust_006", name: "Fiona Gallagher", email: "fiona.gallagher@example.com", phone: "+1-555-0106" },
    { id: "cust_007", name: "George Clark", email: "george.clark@example.com", phone: "+1-555-0107" },
    { id: "cust_008", name: "Hannah Abbott", email: "hannah.abbott@example.com", phone: "+1-555-0108" },
    { id: "cust_009", name: "Ian Malcolm", email: "ian.malcolm@example.com", phone: "+1-555-0109" },
    { id: "cust_010", name: "Julia Roberts", email: "julia.roberts@example.com", phone: "+1-555-0110" },
    { id: "cust_011", name: "Kevin Hart", email: "kevin.hart@example.com", phone: "+1-555-0111" },
    { id: "cust_012", name: "Laura Croft", email: "laura.croft@example.com", phone: "+1-555-0112" },
    { id: "cust_013", name: "Michael Scott", email: "michael.scott@example.com", phone: "+1-555-0113" },
    { id: "cust_014", name: "Nina Simone", email: "nina.simone@example.com", phone: "+1-555-0114" },
    { id: "cust_015", name: "Oliver Queen", email: "oliver.queen@example.com", phone: "+1-555-0115" },
  ];

  for (const c of customersData) {
    await prisma.customer.create({
      data: c,
    });
  }
  console.log(`Created ${customersData.length} customers.`);

  // 2. Create Orders for the 6 Refund Scenarios + Standard Orders
  const ordersData = [
    // Scenario 1: ELIGIBLE REFUND
    // Delivered recently (5 days ago), standard product, not refunded, not fraudulent
    {
      id: "ORD-ELIGIBLE-101",
      customerId: "cust_001",
      productName: "Sony WH-1000XM5 Wireless Headphones",
      productCategory: "Electronics",
      amount: 399.99,
      orderDate: daysAgo(7),
      deliveryDate: daysAgo(5),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },

    // Scenario 2: EXPIRED REFUND
    // Delivered more than 30 days ago (45 days ago)
    {
      id: "ORD-EXPIRED-102",
      customerId: "cust_002",
      productName: "Apple Watch Series 9 GPS 45mm",
      productCategory: "Wearables",
      amount: 429.00,
      orderDate: daysAgo(50),
      deliveryDate: daysAgo(45),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },

    // Scenario 3: ALREADY REFUNDED
    // Order already has a completed refund
    {
      id: "ORD-REFUNDED-103",
      customerId: "cust_003",
      productName: "Logitech MX Master 3S Mouse",
      productCategory: "Computer Accessories",
      amount: 99.99,
      orderDate: daysAgo(15),
      deliveryDate: daysAgo(12),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.COMPLETED,
      isClearanceItem: false,
      isFraudulent: false,
    },

    // Scenario 4: CLEARANCE PRODUCT
    // Clearance / final-sale product
    {
      id: "ORD-CLEARANCE-104",
      customerId: "cust_004",
      productName: "Ultra HD 4K Gaming Monitor (Final Sale)",
      productCategory: "Electronics",
      amount: 249.50,
      orderDate: daysAgo(10),
      deliveryDate: daysAgo(6),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: true,
      isFraudulent: false,
    },

    // Scenario 5: FRAUDULENT ORDER
    // Marked fraudulent
    {
      id: "ORD-FRAUD-105",
      customerId: "cust_005",
      productName: "PlayStation 5 Pro Console Bundle",
      productCategory: "Gaming",
      amount: 799.99,
      orderDate: daysAgo(8),
      deliveryDate: daysAgo(4),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: true,
    },

    // Scenario 6: NOT DELIVERED
    // Order has not been delivered yet
    {
      id: "ORD-NOT-DELIVERED-106",
      customerId: "cust_006",
      productName: "Dyson V15 Detect Cordless Vacuum",
      productCategory: "Home Appliances",
      amount: 749.99,
      orderDate: daysAgo(3),
      deliveryDate: null,
      status: OrderStatus.SHIPPED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },

    // Additional standard orders for customers 7 through 15
    {
      id: "ORD-STD-107",
      customerId: "cust_007",
      productName: "Dell 27-inch 4K USB-C Hub Monitor",
      productCategory: "Electronics",
      amount: 349.99,
      orderDate: daysAgo(20),
      deliveryDate: daysAgo(16),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-108",
      customerId: "cust_008",
      productName: "Ergonomic Mesh Office Chair",
      productCategory: "Furniture",
      amount: 189.00,
      orderDate: daysAgo(25),
      deliveryDate: daysAgo(20),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-109",
      customerId: "cust_009",
      productName: "Kindle Paperwhite 16GB",
      productCategory: "Electronics",
      amount: 149.99,
      orderDate: daysAgo(12),
      deliveryDate: daysAgo(8),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-110",
      customerId: "cust_010",
      productName: "Bose QuietComfort 45 Headphones",
      productCategory: "Electronics",
      amount: 279.00,
      orderDate: daysAgo(22),
      deliveryDate: daysAgo(18),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-111",
      customerId: "cust_011",
      productName: "Mechanical Gaming Keyboard RGB",
      productCategory: "Computer Accessories",
      amount: 129.99,
      orderDate: daysAgo(14),
      deliveryDate: daysAgo(10),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-112",
      customerId: "cust_012",
      productName: "Anker 100W Fast GaN Wall Charger",
      productCategory: "Accessories",
      amount: 59.99,
      orderDate: daysAgo(6),
      deliveryDate: daysAgo(4),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-113",
      customerId: "cust_013",
      productName: "Stainless Steel Insulated Travel Tumbler",
      productCategory: "Home & Kitchen",
      amount: 34.50,
      orderDate: daysAgo(4),
      deliveryDate: daysAgo(2),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-114",
      customerId: "cust_014",
      productName: "Yamaha P-125 Digital Piano",
      productCategory: "Musical Instruments",
      amount: 649.00,
      orderDate: daysAgo(18),
      deliveryDate: daysAgo(12),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
    {
      id: "ORD-STD-115",
      customerId: "cust_015",
      productName: "Garmin Fenix 7 Sapphire Solar Watch",
      productCategory: "Wearables",
      amount: 799.99,
      orderDate: daysAgo(24),
      deliveryDate: daysAgo(19),
      status: OrderStatus.DELIVERED,
      refundStatus: RefundStatus.NOT_REQUESTED,
      isClearanceItem: false,
      isFraudulent: false,
    },
  ];

  for (const o of ordersData) {
    await prisma.order.create({
      data: o,
    });
  }
  console.log(`Created ${ordersData.length} orders.`);

  // 3. Create Refund Record for the Already-Refunded Order (Scenario 3)
  const refund = await prisma.refund.create({
    data: {
      id: "REF-COMPLETED-103",
      orderId: "ORD-REFUNDED-103",
      customerId: "cust_003",
      amount: 99.99,
      status: RefundStatus.COMPLETED,
      reason: "Item returned in original packaging. Refund approved and issued.",
      createdAt: daysAgo(10),
    },
  });
  console.log(`Created refund: ${refund.id} for order ${refund.orderId}.`);

  // 4. Seed an initial AgentLog to confirm logging functionality
  await prisma.agentLog.create({
    data: {
      sessionId: "session_init_001",
      eventType: "SYSTEM_SEED",
      toolName: "database_seed",
      message: "Database initialized and seeded with 15 customers and 15 orders.",
      status: AgentLogStatus.SUCCESS,
      metadata: JSON.stringify({
        customerCount: customersData.length,
        orderCount: ordersData.length,
        refundCount: 1,
      }),
    },
  });
  console.log("Created initial AgentLog entry.");

  console.log("Seeding finished successfully!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
