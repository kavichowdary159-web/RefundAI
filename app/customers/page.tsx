import { CustomersTable } from "@/components/customers/CustomersTable";

export const metadata = {
  title: "Customers - RefundAI",
  description: "Verified customer accounts and order histories from SQLite database.",
};

export default function CustomersPage() {
  return <CustomersTable />;
}
