import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { toComplaintDTO } from "@/lib/server/dto"
import { appendAudit } from "@/lib/server/audit"

/** One-time migration: pull complaints from the legacy localStorage blob. */
export async function POST(request: NextRequest) {
  const admin = await requireRole(["admin"])
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const raw = body?.complaints
  if (!Array.isArray(raw)) {
    return Response.json({ error: "complaints array required" }, { status: 400 })
  }

  let imported = 0
  let skipped = 0

  for (const c of raw) {
    if (!c?.complaint_id || !c?.ward || !c?.complaint_type) {
      skipped++
      continue
    }
    const exists = await db.complaint.findUnique({ where: { complaint_id: c.complaint_id } })
    if (exists) {
      skipped++
      continue
    }

    const reported = c.date_reported ? new Date(String(c.date_reported).replace(" ", "T")) : new Date()
    const resolved = c.date_resolved ? new Date(String(c.date_resolved).replace(" ", "T")) : null

    // Recompute severity from the type weight so legacy rows join the pipeline.
    const { TYPE_WEIGHTS, SLA_HOURS, priorityFromScore, DEPARTMENTS } = await import("@/lib/server/severity")
    const weight = TYPE_WEIGHTS[c.complaint_type] ?? 50
    const score = Math.min(100, weight + 5)
    const priority = priorityFromScore(score)

    await db.complaint.create({
      data: {
        complaint_id: c.complaint_id,
        ward: c.ward,
        complaint_type: c.complaint_type,
        description: c.description ?? "",
        photo: c.photo ?? null,
        latitude: c.latitude ?? null,
        longitude: c.longitude ?? null,
        status: c.status ?? "Pending",
        priority,
        severity_score: score,
        severity_reason: "imported from legacy data",
        sla_due_at: new Date(reported.getTime() + SLA_HOURS[priority] * 3600 * 1000),
        department: DEPARTMENTS[c.complaint_type] ?? null,
        citizen_satisfaction: c.citizen_satisfaction ?? null,
        community_verification_score: c.community_verification_score ?? null,
        date_reported: reported,
        date_resolved: resolved,
        created_by: c.created_by ?? admin.email,
        events: {
          create: {
            type: "submitted",
            actor: c.created_by ?? admin.email,
            actor_role: "citizen",
            message: "Imported from legacy records",
            meta: "{}",
          },
        },
      },
    })
    imported++
  }

  await appendAudit({
    actor: admin.email,
    action: "system.import_legacy",
    entity: "system",
    details: { imported, skipped },
  })

  return Response.json({ ok: true, imported, skipped })
}
