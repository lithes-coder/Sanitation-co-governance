import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { transition } from "@/lib/server/workflow"

/**
 * Inbound webhook for a real corporation system to call back into the
 * platform (status flips, field updates). Protected by a shared secret.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.AUTHORITY_WEBHOOK_SECRET || ""
  if (secret && request.headers.get("X-Webhook-Secret") !== secret) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.complaint_id || !body?.status) {
    return Response.json({ error: "complaint_id and status are required" }, { status: 400 })
  }

  const complaint = await db.complaint.findUnique({ where: { complaint_id: body.complaint_id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })

  await db.complaint.update({
    where: { complaint_id: body.complaint_id },
    data: { status: String(body.status) },
  })
  await transition({
    complaintId: body.complaint_id,
    actor: "authority-gateway",
    actorRole: "system",
    eventType: "updated",
    newStatus: String(body.status),
    message: `Authority webhook: status set to ${body.status}`,
    meta: { source: "authority_webhook" },
  })

  return Response.json({ ok: true })
}
