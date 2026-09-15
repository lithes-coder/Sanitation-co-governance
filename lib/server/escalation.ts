import { db } from "./db"
import { appendAudit } from "./audit"
import { createNotifications } from "./notifications"
import { publish } from "./realtime"
import { transition } from "./workflow"

const OPEN_STATUSES = ["Pending", "SentToCorporation", "Verified", "Assigned", "In Progress"]

async function sweepEscalations() {
  const now = new Date()
  const breached = await db.complaint.findMany({
    where: {
      status: { in: OPEN_STATUSES },
      sla_due_at: { lt: now },
    },
    select: { complaint_id: true, ward: true, complaint_type: true, created_by: true, gcc_ticket_ref: true },
  })

  for (const c of breached) {
    try {
      await transition({
        complaintId: c.complaint_id,
        actor: "system",
        actorRole: "system",
        eventType: "escalated",
        newStatus: "Escalated",
        message: `SLA breached — auto-escalated (ticket ${c.gcc_ticket_ref ?? "n/a"})`,
        meta: { escalatedAt: now.toISOString() },
      })
      await db.complaint.update({
        where: { complaint_id: c.complaint_id },
        data: { escalated_at: now },
      })
      await createNotifications({
        audience: "staff",
        type: "escalated",
        title: "SLA breached — complaint escalated",
        body: `${c.complaint_type} in ${c.ward} (ticket ${c.gcc_ticket_ref ?? "n/a"}) needs urgent attention`,
        complaintId: c.complaint_id,
      })
      await createNotifications({
        audience: { user: c.created_by },
        type: "escalated",
        title: "Your complaint was escalated",
        body: `${c.complaint_type} in ${c.ward} exceeded its resolution SLA and has been escalated to senior officers`,
        complaintId: c.complaint_id,
      })
      await appendAudit({
        actor: "system",
        action: "complaint.escalated",
        entity: "complaint",
        entityId: c.complaint_id,
        details: { breachedAt: now.toISOString() },
      })
    } catch {
      // keep sweeping even if one row fails
    }
  }

  if (breached.length > 0) publish("complaints", {})
}

type TimerState = { started?: boolean }
const globalForTimer = globalThis as unknown as { __scgipEscalation?: TimerState }

/** Idempotent: starts the 60s sweep once per server process. */
export function ensureEscalationTimer() {
  if (globalForTimer.__scgipEscalation?.started) return
  globalForTimer.__scgipEscalation = { started: true }
  setInterval(() => {
    sweepEscalations().catch(() => {})
  }, 60_000)
}
