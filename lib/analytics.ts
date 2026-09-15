import type { Complaint } from "./types"
import { WARDS, SLA_THRESHOLD_DAYS } from "./types"

/**
 * Analytics accepts any complaint-shaped rows (store DTOs, DB rows, legacy
 * records) — only the fields below are read.
 */
type AnalyticsComplaint = {
  complaint_id?: string
  ward: string
  complaint_type: string
  status: string
  date_reported: string
  date_resolved: string | null
  citizen_satisfaction: number | null
  community_verification_score: number | null
}

/**
 * SERI = Sanitation Equity & Risk Index
 * Calculated per ward based on:
 *   - Recurrence rate (how often complaints come back)
 *   - Resolution time (avg days to resolve)
 *   - Satisfaction (avg citizen rating)
 *   - Fairness (equitable distribution of complaints)
 *   - Community verification (avg verification score)
 *
 * Score 0-100 where higher is better.
 */
export function calculateSERI(complaints: AnalyticsComplaint[], ward: string) {
  const wardComplaints = complaints.filter((c) => c.ward === ward)
  if (wardComplaints.length === 0)
    return { score: 100, recurrence: 0, avgResTime: 0, avgSat: 0, fairness: 100, avgVerification: 0 }

  // Recurrence: how many complaint types appear more than once
  const typeCounts: Record<string, number> = {}
  wardComplaints.forEach((c) => {
    typeCounts[c.complaint_type] = (typeCounts[c.complaint_type] || 0) + 1
  })
  const recurringTypes = Object.values(typeCounts).filter((v) => v > 1).length
  const totalTypes = Object.keys(typeCounts).length
  const recurrenceRate = totalTypes > 0 ? (recurringTypes / totalTypes) * 100 : 0

  // Resolution time in days
  const resolved = wardComplaints.filter((c) => c.status === "Resolved" && c.date_resolved)
  let avgResTime = 0
  if (resolved.length > 0) {
    const totalDays = resolved.reduce((sum, c) => {
      const reported = new Date(c.date_reported).getTime()
      const res = new Date(c.date_resolved!).getTime()
      return sum + (res - reported) / (1000 * 60 * 60 * 24)
    }, 0)
    avgResTime = totalDays / resolved.length
  }

  // Satisfaction average
  const rated = wardComplaints.filter((c) => c.citizen_satisfaction !== null)
  const avgSat = rated.length > 0 ? rated.reduce((s, c) => s + (c.citizen_satisfaction ?? 0), 0) / rated.length : 3

  // Community verification average
  const verified = wardComplaints.filter((c) => c.community_verification_score !== null)
  const avgVerification =
    verified.length > 0
      ? verified.reduce((s, c) => s + (c.community_verification_score ?? 0), 0) / verified.length
      : 3

  // Fairness: how proportional this ward's complaints are compared to average
  const totalAll = complaints.length
  const wardRatio = wardComplaints.length / Math.max(totalAll, 1)
  const expectedRatio = 1 / WARDS.length
  const fairnessDeviation = Math.abs(wardRatio - expectedRatio) / expectedRatio
  const fairness = Math.max(0, 100 - fairnessDeviation * 100)

  // SERI composite (now includes community verification)
  const recurrenceScore = Math.max(0, 100 - recurrenceRate * 2)
  const resTimeScore = Math.max(0, 100 - avgResTime * 10)
  const satScore = (avgSat / 5) * 100
  const verificationScore = (avgVerification / 5) * 100
  const seri =
    recurrenceScore * 0.2 +
    resTimeScore * 0.2 +
    satScore * 0.25 +
    fairness * 0.15 +
    verificationScore * 0.2

  return {
    score: Math.round(Math.max(0, Math.min(100, seri))),
    recurrence: Math.round(recurrenceRate),
    avgResTime: Math.round(avgResTime * 10) / 10,
    avgSat: Math.round(avgSat * 10) / 10,
    fairness: Math.round(fairness),
    avgVerification: Math.round(avgVerification * 10) / 10,
  }
}

export function getRiskBadge(score: number): { label: string; color: "destructive" | "warning" | "success" } {
  if (score < 40) return { label: "High Risk", color: "destructive" }
  if (score < 70) return { label: "Moderate", color: "warning" }
  return { label: "Good", color: "success" }
}

export function getMonthlyTrend(complaints: AnalyticsComplaint[]) {
  const months: Record<string, number> = {}
  complaints.forEach((c) => {
    const date = new Date(c.date_reported)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    months[key] = (months[key] || 0) + 1
  })
  return Object.entries(months)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))
}

export function getComplaintsByType(complaints: AnalyticsComplaint[]) {
  const types: Record<string, number> = {}
  complaints.forEach((c) => {
    types[c.complaint_type] = (types[c.complaint_type] || 0) + 1
  })
  return Object.entries(types).map(([type, count]) => ({ type, count }))
}

export function getRecurrenceByWard(complaints: AnalyticsComplaint[]) {
  return WARDS.map((ward) => {
    const wc = complaints.filter((c) => c.ward === ward)
    const typeCounts: Record<string, number> = {}
    wc.forEach((c) => {
      typeCounts[c.complaint_type] = (typeCounts[c.complaint_type] || 0) + 1
    })
    const recurring = Object.entries(typeCounts).filter(([, v]) => v > 1)
    return {
      ward,
      total: wc.length,
      recurringTypes: recurring.length,
      topRecurring: recurring.sort((a, b) => b[1] - a[1])[0]?.[0] || "None",
      topCount: recurring.sort((a, b) => b[1] - a[1])[0]?.[1] || 0,
    }
  })
}

export function getSilentZones(complaints: AnalyticsComplaint[]) {
  const now = Date.now()
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
  const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000

  return WARDS.map((ward) => {
    const wc = complaints.filter((c) => c.ward === ward)
    const recent = wc.filter((c) => new Date(c.date_reported).getTime() > thirtyDaysAgo).length
    const previous = wc.filter((c) => {
      const t = new Date(c.date_reported).getTime()
      return t > sixtyDaysAgo && t <= thirtyDaysAgo
    }).length

    const dropRatio = previous > 0 ? ((previous - recent) / previous) * 100 : 0
    return {
      ward,
      recentComplaints: recent,
      previousComplaints: previous,
      dropRatio: Math.round(dropRatio),
      isSilent: dropRatio > 50 && previous >= 2,
    }
  })
}

/** Get complaints that are unresolved for more than 30 days */
export function getMonthlyUnresolved(complaints: AnalyticsComplaint[]) {
  const now = Date.now()
  const thresholdMs = SLA_THRESHOLD_DAYS * 24 * 60 * 60 * 1000
  return complaints.filter((c) => {
    if (c.status === "Resolved") return false
    const reported = new Date(c.date_reported).getTime()
    return now - reported > thresholdMs
  })
}

/** Get wards flagged as "Governance Risk" (has unresolved > 30 days) */
export function getGovernanceRiskWards(complaints: AnalyticsComplaint[]) {
  const unresolved = getMonthlyUnresolved(complaints)
  const wards = new Set(unresolved.map((c) => c.ward))
  return Array.from(wards)
}

/** Get verification statistics */
export function getVerificationStats(complaints: AnalyticsComplaint[]) {
  const verified = complaints.filter((c) => c.community_verification_score !== null)
  const totalVerified = verified.length
  const avgScore =
    totalVerified > 0
      ? verified.reduce((s, c) => s + (c.community_verification_score ?? 0), 0) / totalVerified
      : 0
  const lowQuality = verified.filter(
    (c) => (c.community_verification_score ?? 0) < 2.5
  ).length
  const reopened = verified.filter(
    (c) => (c.community_verification_score ?? 0) < 2.5 && c.status !== "Resolved"
  ).length

  return {
    totalVerified,
    avgScore: Math.round(avgScore * 10) / 10,
    lowQuality,
    reopened,
  }
}
