export type UserRole = "admin" | "officer" | "citizen"

export interface User {
  email: string
  name: string
  role: UserRole
  createdAt?: string
}

export type ComplaintStatus =
  | "Pending"
  | "SentToCorporation"
  | "Verified"
  | "Assigned"
  | "In Progress"
  | "Resolved"
  | "Closed"
  | "Rejected"
  | "Escalated"

export type ComplaintPriority = "Critical" | "High" | "Medium" | "Low"

export interface Complaint {
  complaint_id: string
  ward: string
  complaint_type: string
  description: string
  photo: string | null
  latitude: number | null
  longitude: number | null
  status: ComplaintStatus
  priority: ComplaintPriority
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
  events: {
    id: string
    type: string
    actor: string
    actor_role: string
    message: string
    meta: Record<string, unknown>
    created_at: string
  }[]
}

export const WARDS = [
  "Ward 1 - Central",
  "Ward 2 - Northside",
  "Ward 3 - Eastgate",
  "Ward 4 - Southpark",
  "Ward 5 - Westfield",
  "Ward 6 - Hilltop",
  "Ward 7 - Riverside",
  "Ward 8 - Industrial",
]

export const COMPLAINT_TYPES = [
  "Illegal Dumping",
  "Missed Collection",
  "Overflowing Bins",
  "Street Sweeping",
  "Hazardous Waste",
  "Drain Blockage",
  "Public Toilet Maintenance",
  "Pest Control",
]

/** All departments/agencies a complaint can be assigned to. */
export const DEPARTMENT_LIST = [
  "Zone Sanitation Contractor",
  "Solid Waste Management",
  "Storm Water Drains Dept",
  "Public Health Dept",
  "Vector Control Cell",
  "Hazardous Waste Facility",
]

// SLA threshold in days - legacy escalation fallback
export const SLA_THRESHOLD_DAYS = 30
// Community verification threshold - below this reopens complaint
export const VERIFICATION_THRESHOLD = 2.5
