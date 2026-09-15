import { db } from "./db"
import { publish } from "./realtime"
import { appendAudit } from "./audit"
import { notifyCitizen, notifyStaff } from "./notifications"
import { MockGateway, notifyAuthorityChannel } from "./authority"
import { calculateSERI } from "@/lib/analytics"

const gateway = new MockGateway()

type ComplaintRow = {
  complaint_id: string
  ward: string
  complaint_type: string
  created_by: string
  status: string
  priority: string
  severity_score: number
  department: string | null
  gcc_ticket_ref: string | null
}

async function addEvent(e: {
  complaintId: string
  type: string
  actor: string
  actorRole?: string
  message: string
  meta?: Record<string, unknown>
}) {    await db.complaintEvent.create({
      data: {
        complaint_id: e.complaintId,
      type: e.type,
      actor: e.actor,
      actor_role: e.actorRole ?? "system",
      message: e.message,
      meta: JSON.stringify(e.meta ?? {}),
    },
  })
}

/** SERI from live DB data, mapped into the shape lib/analytics expects. */
async function wardSeri(ward: string): Promise<number> {
  const rows = await db.complaint.findMany({
    where: { ward },
    select: {
      ward: true,
      complaint_type: true,
      status: true,
      date_reported: true,
      date_resolved: true,
      citizen_satisfaction: true,
      community_verification_score: true,
    },
  })
  const mapped = rows.map((r) => ({
    ...r,
    date_reported: r.date_reported.toISOString().replace("T", " ").slice(0, 19),
    date_resolved: r.date_resolved ? r.date_resolved.toISOString().replace("T", " ").slice(0, 19) : null,
  }))
  return calculateSERI(mapped as never, ward).score
}

export { wardSeri }

/**
 * Post-submit: forward to the corporation via the gateway, record the ack,
 * and notify staff. Runs after the submit response has returned.
 */
export async function runPostSubmit(complaintId: string) {
  const c = await db.complaint.findUnique({ where: { complaint_id: complaintId } })
  if (!c) return

  try {
    const ack = await gateway.send({
      complaint_id: c.complaint_id,
      ward: c.ward,
      complaint_type: c.complaint_type,
      description: c.description,
      priority: c.priority,
      severity_score: c.severity_score,
      department: c.department ?? "Solid Waste Management",
      latitude: c.latitude,
      longitude: c.longitude,
    })

    await db.complaint.update({
      where: { complaint_id: complaintId },
      data: {
        gcc_ticket_ref: ack.ticketRef,
        acked_at: ack.ackedAt,
        status: c.status === "Pending" ? "SentToCorporation" : c.status,
      },
    })

    await addEvent({
      complaintId,
      type: "sent_to_corporation",
      actor: "system",
      message: `Forwarded to Corporation — ticket ${ack.ticketRef} (dept: ${c.department ?? "Solid Waste Management"})`,
      meta: { ticketRef: ack.ticketRef, department: c.department, priority: c.priority },
    })

    await notifyStaff({
      type: "complaint_submitted",
      title: `New ${c.priority.toLowerCase()} priority complaint`,
      body: `${c.complaint_type} in ${c.ward} — ticket ${ack.ticketRef}`,
      complaintId,
    })

    await appendAudit({
      actor: "system",
      action: "authority.ack",
      entity: "complaint",
      entityId: complaintId,
      details: { ticketRef: ack.ticketRef },
    })

    void notifyAuthorityChannel({ event: "complaint.forwarded", complaintId, ticketRef: ack.ticketRef })
  } catch (err) {
    await addEvent({
      complaintId,
      type: "updated",
      actor: "system",
      message: "Authority gateway failed — complaint retained in local queue",
      meta: { error: String(err) },
    })
  } finally {
    publish("complaints", { complaintId })
  }
}

/** Generic status transition with timeline event + notifications + audit. */
export async function transition(input: {
  complaintId: string
  actor: string
  actorRole: string
  eventType: string
  newStatus?: string
  message: string
  meta?: Record<string, unknown>
}) {
  const c = await db.complaint.findUnique({ where: { complaint_id: input.complaintId } })
  if (!c) throw new Error("Complaint not found")

  if (input.newStatus) {
    await db.complaint.update({
      where: { complaint_id: input.complaintId },
      data: { status: input.newStatus },
    })
  }

  await addEvent({
    complaintId: input.complaintId,
    type: input.eventType,
    actor: input.actor,
    actorRole: input.actorRole,
    message: input.message,
    meta: input.meta,
  })

  await appendAudit({
    actor: input.actor,
    action: `complaint.${input.eventType}`,
    entity: "complaint",
    entityId: input.complaintId,
    details: { status: input.newStatus ?? c.status, ...input.meta },
  })

  publish("complaints", { complaintId: input.complaintId })
  return c
}

export type { ComplaintRow }
