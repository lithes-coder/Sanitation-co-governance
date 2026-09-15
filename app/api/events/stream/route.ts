import { getCurrentUser } from "@/lib/server/auth"
import { subscribe, type RealtimeEvent } from "@/lib/server/realtime"
import { ensureEscalationTimer } from "@/lib/server/escalation"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const user = await getCurrentUser()
  if (!user) return new Response("Unauthorized", { status: 401 })

  ensureEscalationTimer()

  const encoder = new TextEncoder()
  let closed = false
  let unsubComplaints: (() => void) | null = null
  let unsubNotifications: (() => void) | null = null
  let keepalive: ReturnType<typeof setInterval> | null = null

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: RealtimeEvent, topic: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ topic, ...event })}\n\n`))
        } catch {
          closed = true
        }
      }

      unsubComplaints = subscribe("complaints", (e) => send(e, "complaints"))
      unsubNotifications = subscribe("notifications", (e) => send(e, "notifications"))

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ topic: "hello", at: new Date().toISOString() })}\n\n`))

      keepalive = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch {
          closed = true
        }
      }, 30_000)
    },
    cancel() {
      closed = true
      unsubComplaints?.()
      unsubNotifications?.()
      if (keepalive) clearInterval(keepalive)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
