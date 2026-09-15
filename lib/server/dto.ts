import type { Complaint, ComplaintEvent, Notification, User } from "@prisma/client"

export type UserDTO = {
  email: string
  name: string
  role: string
  createdAt: string
}

export function toUserDTO(u: User): UserDTO {
  return {
    email: u.email,
    name: u.name,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }
}

export type ComplaintEventDTO = {
  id: string
  type: string
  actor: string
  actor_role: string
  message: string
  meta: Record<string, unknown>
  created_at: string
}

export function toEventDTO(e: ComplaintEvent): ComplaintEventDTO {
  let meta: Record<string, unknown> = {}
  try {
    meta = JSON.parse(e.meta)
  } catch {
    meta = {}
  }
  return {
    id: e.id,
    type: e.type,
    actor: e.actor,
    actor_role: e.actor_role,
    message: e.message,
    meta,
    created_at: e.createdAt.toISOString(),
  }
}

export type ComplaintDTO = {
  complaint_id: string
  ward: string
  complaint_type: string
  description: string
  photo: string | null
  latitude: number | null
  longitude: number | null

  status: string
  priority: string
  severity_score: number
  severity_reason: string
  sla_due_at: string | null
  department: string | null
  gcc_ticket_ref: string | null
  verification_status: string
  verification_note: string | null
  assigned_to: string | null
  resolution_note: string | null
  after_photo: string | null

  citizen_satisfaction: number | null
  community_verification_score: number | null
  reopened_count: number
  trust_points: number

  date_reported: string
  date_resolved: string | null
  date_closed: string | null
  escalated_at: string | null
  acked_at: string | null
  updated_at: string

  created_by: string
  events: ComplaintEventDTO[]
}

type ComplaintWithEvents = Complaint & { events: ComplaintEvent[] }

export function toComplaintDTO(c: ComplaintWithEvents): ComplaintDTO {
  return {
    complaint_id: c.complaint_id,
    ward: c.ward,
    complaint_type: c.complaint_type,
    description: c.description,
    photo: c.photo,
    latitude: c.latitude,
    longitude: c.longitude,

    status: c.status,
    priority: c.priority,
    severity_score: c.severity_score,
    severity_reason: c.severity_reason,
    sla_due_at: c.sla_due_at?.toISOString() ?? null,
    department: c.department,
    gcc_ticket_ref: c.gcc_ticket_ref,
    verification_status: c.verification_status,
    verification_note: c.verification_note,
    assigned_to: c.assigned_to,
    resolution_note: c.resolution_note,
    after_photo: c.after_photo,

    citizen_satisfaction: c.citizen_satisfaction,
    community_verification_score: c.community_verification_score,
    reopened_count: c.reopened_count,
    trust_points: c.trust_points,

    date_reported: c.date_reported.toISOString(),
    date_resolved: c.date_resolved?.toISOString() ?? null,
    date_closed: c.date_closed?.toISOString() ?? null,
    escalated_at: c.escalated_at?.toISOString() ?? null,
    acked_at: c.acked_at?.toISOString() ?? null,
    updated_at: c.updated_at.toISOString(),

    created_by: c.created_by,
    events: c.events
      .map(toEventDTO)
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }
}

export type NotificationDTO = {
  id: string
  type: string
  title: string
  body: string
  complaint_id: string | null
  read: boolean
  created_at: string
}

export function toNotificationDTO(n: Notification): NotificationDTO {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    complaint_id: n.complaint_id,
    read: n.read,
    created_at: n.createdAt.toISOString(),
  }
}
