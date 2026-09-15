import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { toComplaintDTO } from "@/lib/server/dto"
import { scoreComplaint } from "@/lib/server/severity"
import { wardSeri, runPostSubmit } from "@/lib/server/workflow"
import { appendAudit } from "@/lib/server/audit"
import { notifyStaff } from "@/lib/server/notifications"
import { publish } from "@/lib/server/realtime"

export async function GET() {
  const user = await requireRole(["citizen", "officer", "admin"])
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const complaints = await db.complaint.findMany({
    where: user.role === "citizen" ? { created_by: user.email } : undefined,
    include: { events: true },
    orderBy: { date_reported: "desc" },
  })

  return Response.json({ complaints: complaints.map(toComplaintDTO) })
}

export async function POST(request: NextRequest) {
  const user = await requireRole(["citizen", "officer", "admin"])
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { ward, type, description, photo, latitude, longitude } = body
    if (!ward || !type || !description?.trim()) {
      return Response.json({ error: "Ward, type and description are required" }, { status: 400 })
    }

    const seri = await wardSeri(ward)
    const sev = scoreComplaint({
      type,
      wardSeri: seri,
      hasPhoto: Boolean(photo),
      hasGPS: latitude != null && longitude != null,
    })

    const now = new Date()
    const slaDue = new Date(now.getTime() + sev.slaHours * 3600 * 1000)

    const complaint = await db.complaint.create({
      data: {
        ward,
        complaint_type: type,
        description: description.trim(),
        photo: photo ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        status: "Pending",
        priority: sev.priority,
        severity_score: sev.score,
        severity_reason: sev.reason,
        sla_due_at: slaDue,
        department: sev.department,
        created_by: user.email,
        events: {
          create: [
            {
              type: "submitted",
              actor: user.email,
              actor_role: user.role,
              message: `Complaint submitted by ${user.name}`,
              meta: JSON.stringify({ ward, type }),
            },
            {
              type: "severity_scored",
              actor: "system",
              message: `Severity ${sev.score}/100 → ${sev.priority} (SLA ${sev.slaHours}h). ${sev.reason}`,
              meta: JSON.stringify({ score: sev.score, priority: sev.priority, slaHours: sev.slaHours }),
            },
          ],
        },
      },
      include: { events: true },
    })

    await notifyStaff({
      type: "complaint_submitted",
      title: `New ${sev.priority.toLowerCase()} priority complaint`,
      body: `${type} in ${ward} — severity ${sev.score}/100`,
      complaintId: complaint.complaint_id,
    })

    await appendAudit({
      actor: user.email,
      action: "complaint.submitted",
      entity: "complaint",
      entityId: complaint.complaint_id,
      details: { ward, type, priority: sev.priority, score: sev.score },
    })

    publish("complaints", { complaintId: complaint.complaint_id })

    // Forward to the corporation after the response returns.
    queueMicrotask(() => {
      runPostSubmit(complaint.complaint_id).catch(() => {})
    })

    return Response.json({ complaint: toComplaintDTO(complaint) }, { status: 201 })
  } catch (err) {
    console.error("submit failed", err)
    return Response.json({ error: "Failed to submit complaint" }, { status: 500 })
  }
}
