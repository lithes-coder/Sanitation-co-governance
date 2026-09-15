"use client"

import { useParams } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { ComplaintDetail } from "@/components/complaint-detail"

export default function CitizenComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <DashboardShell requiredRole="citizen">
      <ComplaintDetail id={id} />
    </DashboardShell>
  )
}
