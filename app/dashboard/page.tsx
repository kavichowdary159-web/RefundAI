import { DashboardView } from "@/components/dashboard/DashboardView";

export const metadata = {
  title: "Agent Dashboard - RefundAI",
  description: "Live AI agent activity, metrics and execution audit logs.",
};

export default function DashboardPage() {
  return <DashboardView />;
}
