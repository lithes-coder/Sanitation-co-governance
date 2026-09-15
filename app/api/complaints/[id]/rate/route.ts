import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { publish } from "@/lib/server/realtime"

/** Citizen satisfaction rating (1-5 stars) on a resolved complaint. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["citizen", "admin"])
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const body = await request.json().catch(() => ({}))
  const rating = Number(body.rating)
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return Response.json({ error: "rating must be 1-5" }, { status: 400 })
  }

  const complaint = await db.complaint.findUnique({ where: { complaint_id: id } })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })
  if (user.role !== "admin" && complaint.created_by !== user.email) {
    return Response.json({ error: "Forbidden" }, { status: 403 })
  }

  await db.complaint.update({ where: { complaint_id: id }, data: { citizen_satisfaction: rating } })

  await db.complaintEvent.create({
    data: {
      complaint_id: id,
      type: "rated",
      actor: user.email,
      actor_role: user.role,
      message: `Citizen rated satisfaction ${rating}/5`,
      meta: JSON.stringify({ rating }),
    },
  })

  publish("complaints", { complaintId: id })
  return Response.json({ ok: true })
}
