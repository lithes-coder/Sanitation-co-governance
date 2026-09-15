import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { getCurrentUser } from "@/lib/server/auth"
import { toNotificationDTO } from "@/lib/server/dto"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { recipient: user.email },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return Response.json({
    notifications: notifications.map(toNotificationDTO),
    unread: notifications.filter((n) => !n.read).length,
  })
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  if (body.action === "mark_all_read") {
    await db.notification.updateMany({
      where: { recipient: user.email, read: false },
      data: { read: true },
    })
    return Response.json({ ok: true })
  }

  if (body.action === "mark_read" && body.id) {
    await db.notification.updateMany({
      where: { id: body.id, recipient: user.email },
      data: { read: true },
    })
    return Response.json({ ok: true })
  }

  return Response.json({ error: "Unknown action" }, { status: 400 })
}
