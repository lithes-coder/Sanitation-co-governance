import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { transition } from "@/lib/server/workflow"
import { notifyCitizen } from "@/lib/server/notifications"

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const officer = await requireRole(["officer", "admin"])
  if (!officer) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const department = (body.department as string | undefined)?.trim()
  if (!department) return Response.json({ error: "department is required" }, { status: 400 })

  const complaint = await db.complaint.findUnique({ where: { complaint_id: id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })

  await db.complaint.update({
    where: { complaint_id: id },
    data: { department, assigned_to: officer.email },
  })

  await transition({
    complaintId: id,
    actor: officer.email,
    actorRole: "officer",
    eventType: "assigned",
    newStatus: "Assigned",
    message: `Assigned to ${department}`,
    meta: { department },
  })

  await notifyCitizen(complaint.created_by, {
    type: "assigned",
    title: "Complaint assigned to a department",
    body: `Your ${complaint.complaint_type} complaint in ${complaint.ward} is now with ${department}`,
    complaintId: id,
  })

  return Response.json({ ok: true, department })
}
