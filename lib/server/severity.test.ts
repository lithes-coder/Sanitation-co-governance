/**
 * Severity engine tests — run with: npm test
 */
import { scoreComplaint, priorityFromScore, wardSeriFactor, TYPE_WEIGHTS, SLA_HOURS } from "./severity"

let passed = 0
let failed = 0

function eq(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) {
    passed++
  } else {
    failed++
    console.error(`✗ ${name}\n   expected ${e}\n   got      ${a}`)
  }
}

// ── Priority tiers ─────────────────────────────────────────────
eq("score 95 → Critical", priorityFromScore(95), "Critical")
eq("score 90 → Critical", priorityFromScore(90), "Critical")
eq("score 89 → High", priorityFromScore(89), "High")
eq("score 70 → High", priorityFromScore(70), "High")
eq("score 69 → Medium", priorityFromScore(69), "Medium")
eq("score 45 → Medium", priorityFromScore(45), "Medium")
eq("score 44 → Low", priorityFromScore(44), "Low")

// ── Ward SERI factor ───────────────────────────────────────────
eq("SERI 20 (high risk) → 1.5", wardSeriFactor(20), 1.5)
eq("SERI 55 (moderate) → 1.15", wardSeriFactor(55), 1.15)
eq("SERI 80 (good) → 1.0", wardSeriFactor(80), 1.0)

// ── SLA hours per tier ────────────────────────────────────────
eq("SLA map", SLA_HOURS, { Critical: 24, High: 72, Medium: 168, Low: 360 })

// ── Scoring scenarios ─────────────────────────────────────────
// Hazardous waste, photo+GPS, high-risk ward: 90*1.5 + 15 = 150 → clamped 100 Critical
const critical = scoreComplaint({ type: "Hazardous Waste", wardSeri: 30, hasPhoto: true, hasGPS: true })
eq("hazardous+evidence+bad ward → Critical", critical.priority, "Critical")
eq("hazardous clamps to 100", critical.score, 100)
eq("hazardous → 24h SLA", critical.slaHours, 24)
eq("hazardous → Hazardous Waste Facility", critical.department, "Hazardous Waste Facility")

// Street sweeping, no evidence, good ward: 40*1.0 = 40 → Low
const low = scoreComplaint({ type: "Street Sweeping", wardSeri: 85, hasPhoto: false, hasGPS: false })
eq("sweeping good ward → Low", low.priority, "Low")
eq("sweeping score 40", low.score, 40)
eq("sweeping → 15d SLA", low.slaHours, 360)
eq("sweeping → Zone Sanitation Contractor", low.department, "Zone Sanitation Contractor")

// Drain blockage, photo only, moderate ward: 80*1.15 + 10 = 102 → clamp 100 Critical
const drain = scoreComplaint({ type: "Drain Blockage", wardSeri: 55, hasPhoto: true, hasGPS: false })
eq("drain moderate ward+photo → Critical", drain.priority, "Critical")
eq("drain score clamps 100", drain.score, 100)

// Missed collection, GPS only, good ward: 50*1.0 + 5 = 55 → Medium
const missed = scoreComplaint({ type: "Missed Collection", wardSeri: 75, hasPhoto: false, hasGPS: true })
eq("missed collection → Medium", missed.priority, "Medium")
eq("missed collection score 55", missed.score, 55)
eq("missed collection → contractor", missed.department, "Zone Sanitation Contractor")

// Unknown type falls back to weight 50 / Solid Waste Management
const unknown = scoreComplaint({ type: "Something Else", wardSeri: 75, hasPhoto: false, hasGPS: false })
eq("unknown type → weight 50", unknown.score, 50)
eq("unknown type → SWM dept", unknown.department, "Solid Waste Management")

// Score never leaves 0-100
eq("weights all present", Object.keys(TYPE_WEIGHTS).length, 8)

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
