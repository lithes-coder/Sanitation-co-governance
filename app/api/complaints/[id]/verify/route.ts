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
  const decision = body.decision as "Genuine" | "NeedsInfo" | "Spam"
  const note = (body.note as string | undefined)?.trim() || null

  if (!["Genuine", "NeedsInfo", "Spam"].includes(decision)) {
    return Response.json({ error: "decision must be Genuine | NeedsInfo | Spam" }, { status: 400 })
  }

  const complaint = await db.complaint.findUnique({ where: { complaint_id: id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })

  if (decision === "Genuine") {
    await db.complaint.update({
      where: { complaint_id: id },
      data: { verification_status: "Verified", verified_at: new Date() },
    })
    await transition({
      complaintId: id,
      actor: officer.email,
      actorRole: "officer",
      eventType: "verified",
      newStatus: "Verified",
      message: `Verified as genuine by Corporation${note ? ` — "${note}"` : ""}`,
      meta: { decision, note },
    })
    await notifyCitizen(complaint.created_by, {
      type: "verified",
      title: "Complaint verified by the Corporation ✓",
      body: `Your ${complaint.complaint_type} complaint in ${complaint.ward} was verified as genuine and moved to the department queue`,
      complaintId: id,
    })
    return Response.json({ ok: true, verification_status: "Verified" })
  }

  if (decision === "NeedsInfo") {
    await db.complaint.update({
      where: { complaint_id: id },
      data: { verification_status: "NeedsInfo", verification_note: note },
    })
    await transition({
      complaintId: id,
      actor: officer.email,
      actorRole: "officer",
      eventType: "needs_info",
      message: `More information requested${note ? ` — "${note}"` : ""}`,
      meta: { decision, note },
    })
    await notifyCitizen(complaint.created_by, {
      type: "info",
      title: "More details needed for your complaint",
      body: note || "The Corporation requested additional details for your complaint",
      complaintId: id,
    })
    return Response.json({ ok: true, verification_status: "NeedsInfo" })
  }

  // Spam
  await db.complaint.update({
    where: { complaint_id: id },
    data: { verification_status: "Spam", verification_note: note },
  })
  await transition({
    complaintId: id,
    actor: officer.email,
    actorRole: "officer",
    eventType: "rejected",
    newStatus: "Rejected",
    message: `Marked as spam by Corporation${note ? ` — "${note}"` : ""}`,
    meta: { decision, note },
  })
  await notifyCitizen(complaint.created_by, {
    type: "citizen_rejected",
    title: "Complaint not accepted",
    body: `Your ${complaint.complaint_type} complaint in ${complaint.ward} was not accepted by the Corporation${note ? `: ${note}` : ""}`,
    complaintId: id,
  })
  return Response.json({ ok: true, verification_status: "Spam" })
}
