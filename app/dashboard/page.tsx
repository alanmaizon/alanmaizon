import { DashboardClient } from "@/components/dashboard/dashboard-client"

export const metadata = {
  title: "Teacher Dashboard — Play & Sing with Alan",
  robots: { index: false, follow: false },
}

export default function DashboardPage() {
  return <DashboardClient />
}
