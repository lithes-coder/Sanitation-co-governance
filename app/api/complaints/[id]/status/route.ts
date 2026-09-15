import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { transition } from "@/lib/server/workflow"
import { notifyCitizen, notifyStaff } from "@/lib/server/notifications"

const VALID = ["Pending", "SentToCorporation", "Verified", "Assigned", "In Progress", "Resolved", "Closed", "Rejected", "Escalated"]

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const admin = await requireRole(["admin"])
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const status = body.status as string
  if (!VALID.includes(status)) return Response.json({ error: "Invalid status" }, { status: 400 })

  const complaint = await db.complaint.findUnique({ where: { complaint_id: id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })

  if (status === "Resolved") {
    await db.complaint.update({
      where: { complaint_id: id },
      data: { status, date_resolved: new Date() },
    })
  } else {
    await db.complaint.update({ where: { complaint_id: id }, data: { status } })
  }

  await transition({
    complaintId: id,
    actor: admin.email,
    actorRole: "admin",
    eventType: "updated",
    newStatus: status,
    message: `Status set to ${status} by administrator`,
    meta: { status },
  })

  await notifyCitizen(complaint.created_by, {
    type: "info",
    title: `Complaint status: ${status}`,
    body: `Your ${complaint.complaint_type} complaint in ${complaint.ward} is now ${status}`,
    complaintId: id,
  })
  await notifyStaff({
    type: "info",
    title: `Status updated to ${status}`,
    body: `${complaint.complaint_type} in ${complaint.ward} — set by administrator`,
    complaintId: id,
  })

  return Response.json({ ok: true })
}
