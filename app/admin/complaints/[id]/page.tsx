"use client"

import { useParams } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { ComplaintDetail } from "@/components/complaint-detail"

export default function AdminComplaintDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <DashboardShell requiredRole="admin">
      <ComplaintDetail id={id} />
    </DashboardShell>
  )
}
