import { db } from "./db"
import { publish } from "./realtime"

/**
 * Create notification rows for an audience.
 * - { audience: "staff" }  → every officer + admin
 * - { user: "email" }      → one recipient
 */
export async function createNotifications(input: {
  audience: "staff" | { user: string }
  type: string
  title: string
  body: string
  complaintId?: string | null
  actorRole?: string
}) {
  let recipients: string[] = []

  if (input.audience === "staff") {
    const staff = await db.user.findMany({
      where: { role: { in: ["officer", "admin"] } },
      select: { email: true },
    })
    recipients = staff.map((s) => s.email)
  } else {
    recipients = [input.audience.user]
  }

  if (recipients.length === 0) return

  await db.notification.createMany({
    data: recipients.map((recipient) => ({
      recipient,
      type: input.type,
      title: input.title,
      body: input.body,
      complaint_id: input.complaintId ?? null,
    })),
  })

  // Wake up SSE subscribers so bells/toasts refresh instantly.
  publish("notifications", { complaintId: input.complaintId ?? undefined })
}

/** Wrapper for actions triggered by a staff member (officer/admin). */
export function notifyStaff(input: {
  type: string
  title: string
  body: string
  complaintId?: string | null
}) {
  return createNotifications({ ...input, audience: "staff" })
}

/** Wrapper for citizen-facing notifications. */
export function notifyCitizen(email: string, input: {
  type: string
  title: string
  body: string
  complaintId?: string | null
}) {
  return createNotifications({ audience: { user: email }, ...input })
}
