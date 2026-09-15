import { db } from "@/lib/server/db"
import { requireRole } from "@/lib/server/auth"
import { toComplaintDTO } from "@/lib/server/dto"

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireRole(["citizen", "officer", "admin"])
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const complaint = await db.complaint.findUnique({
    where: { complaint_id: id },
    include: { events: true },
  })
  if (!complaint) return Response.json({ error: "Not found" }, { status: 404 })
  if (user.role === "citizen" && complaint.created_by !== user.email) {
    return Response.json({ error: "Not found" }, { status: 404 })
  }

  return Response.json({ complaint: toComplaintDTO(complaint) })
}
