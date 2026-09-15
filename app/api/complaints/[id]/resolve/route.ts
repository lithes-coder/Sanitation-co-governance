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
  const note = (body.note as string | undefined)?.trim()
  const afterPhoto = (body.after_photo as string | undefined) || null

  if (!note) return Response.json({ error: "A work-done note is required" }, { status: 400 })

  const complaint = await db.complaint.findUnique({ where: { complaint_id: id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })

  const now = new Date()
  await db.complaint.update({
    where: { complaint_id: id },
    data: {
      status: "Resolved",
      resolution_note: note,
      after_photo: afterPhoto,
      date_resolved: now,
    },
  })

  await transition({
    complaintId: id,
    actor: officer.email,
    actorRole: "officer",
    eventType: "resolved",
    newStatus: "Resolved",
    message: `Resolved by ${complaint.department ?? "the department"} — ${note}`,
    meta: { hasAfterPhoto: Boolean(afterPhoto) },
  })

  await notifyCitizen(complaint.created_by, {
    type: "resolved",
    title: "Complaint resolved — please confirm ✓",
    body: `Your ${complaint.complaint_type} complaint in ${complaint.ward} was marked resolved. Review the evidence and confirm.`,
    complaintId: id,
  })

  return Response.json({ ok: true })
}
