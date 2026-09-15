import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { transition } from "@/lib/server/workflow"
import { notifyStaff } from "@/lib/server/notifications"

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["citizen", "admin"])
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const accept = body.accept === true
  const note = (body.note as string | undefined)?.trim() || null

  const complaint = await db.complaint.findUnique({ where: { complaint_id: id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "admin" && complaint.created_by !== user.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  if (accept) {
    const now = new Date()
    await db.complaint.update({
      where: { complaint_id: id },
      data: {
        status: "Closed",
        date_closed: now,
        trust_points: { increment: 5 },
      },
    })
    await transition({
      complaintId: id,
      actor: user.email,
      actorRole: user.role,
      eventType: "citizen_confirmed",
      newStatus: "Closed",
      message: `Citizen confirmed the resolution${note ? ` — "${note}"` : ""} (+5 trust points)`,
      meta: { accept: true },
    })
    await notifyStaff({
      type: "citizen_confirmed",
      title: "Citizen confirmed resolution ✓",
      body: `${complaint.complaint_type} in ${complaint.ward} was confirmed by the citizen`,
      complaintId: id,
    })
    return Response.json({ ok: true, status: "Closed" })
  }

  // Rejected → reopen
  await db.complaint.update({
    where: { complaint_id: id },
    data: {
      status: "In Progress",
      date_resolved: null,
      reopened_count: { increment: 1 },
      community_verification_score: 1,
    },
  })
  await transition({
    complaintId: id,
    actor: user.email,
    actorRole: user.role,
    eventType: "citizen_rejected",
    newStatus: "In Progress",
    message: `Citizen rejected the resolution — reopened${note ? `: "${note}"` : ""}`,
    meta: { accept: false },
  })
  await notifyStaff({
    type: "citizen_rejected",
    title: "Citizen rejected the resolution — reopened",
    body: `${complaint.complaint_type} in ${complaint.ward} was reopened by the citizen${note ? `: ${note}` : ""}`,
    complaintId: id,
  })
  return Response.json({ ok: true, status: "In Progress" })
}
