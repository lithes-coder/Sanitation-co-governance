/**
 * Severity engine: turns a raw complaint into a 0-100 severity score,
 * a priority tier with its own SLA, and the responsible department.
 *
 * score = type weight × ward SERI factor + evidence bonus
 */

export const TYPE_WEIGHTS: Record<string, number> = {
  "Hazardous Waste": 90,
  "Drain Blockage": 80,
  "Illegal Dumping": 70,
  "Overflowing Bins": 60,
  "Public Toilet Maintenance": 55,
  "Missed Collection": 50,
  "Pest Control": 45,
  "Street Sweeping": 40,
}

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const
export type Priority = (typeof PRIORITIES)[number]

/** SLA in hours per priority tier */
export const SLA_HOURS: Record<Priority, number> = {
  Critical: 24, // 1 day
  High: 72, // 3 days
  Medium: 168, // 7 days
  Low: 360, // 15 days
}

/** Complaint type → responsible department / agency */
export const DEPARTMENTS: Record<string, string> = {
  "Hazardous Waste": "Hazardous Waste Facility",
  "Drain Blockage": "Storm Water Drains Dept",
  "Overflowing Bins": "Solid Waste Management",
  "Illegal Dumping": "Solid Waste Management",
  "Missed Collection": "Zone Sanitation Contractor",
  "Street Sweeping": "Zone Sanitation Contractor",
  "Public Toilet Maintenance": "Public Health Dept",
  "Pest Control": "Vector Control Cell",
}

/** Lower ward SERI (worse sanitation) boosts urgency */
export function wardSeriFactor(seri: number): number {
  if (seri < 40) return 1.5
  if (seri < 70) return 1.15
  return 1.0
}

export function priorityFromScore(score: number): Priority {
  if (score >= 90) return "Critical"
  if (score >= 70) return "High"
  if (score >= 45) return "Medium"
  return "Low"
}

export type SeverityResult = {
  score: number
  priority: Priority
  slaHours: number
  department: string
  reason: string
}

/**
 * Score a complaint.
 * @param wardSeri current SERI of the ward (0-100, higher = better sanitation)
 */
export function scoreComplaint(input: {
  type: string
  wardSeri: number
  hasPhoto: boolean
  hasGPS: boolean
}): SeverityResult {
  const { type, wardSeri, hasPhoto, hasGPS } = input

  const weight = TYPE_WEIGHTS[type] ?? 50
  const seriFactor = wardSeriFactor(wardSeri)
  const evidence = (hasPhoto ? 10 : 0) + (hasGPS ? 5 : 0)

  const raw = weight * seriFactor + evidence
  const score = Math.round(Math.max(0, Math.min(100, raw)))

  const priority = priorityFromScore(score)
  const slaHours = SLA_HOURS[priority]
  const department = DEPARTMENTS[type] ?? "Solid Waste Management"

  const reasons: string[] = []
  reasons.push(`Type "${type}" base weight ${weight}/100`)
  if (seriFactor > 1) {
    reasons.push(
      `ward SERI ${wardSeri} is ${wardSeri < 40 ? "high-risk" : "moderate"} → ×${seriFactor}`
    )
  }
  if (hasPhoto) reasons.push("photo evidence +10")
  if (hasGPS) reasons.push("GPS pin +5")
  reasons.push(`tier: ${priority} (SLA ${slaHours}h)`)

  return {
    score,
    priority,
    slaHours,
    department,
    reason: reasons.join("; "),
  }
}
