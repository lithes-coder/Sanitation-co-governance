import type { Complaint } from "./types"
import { WARDS } from "./types"

/**
 * Export functions accept any complaint-shaped rows (store DTOs, DB rows,
 * legacy records) — only the fields below are read.
 */
type ExportComplaint = {
  complaint_id: string
  ward: string
  complaint_type: string
  description: string
  latitude: number | null
  longitude: number | null
  status: string
  date_reported: string
  date_resolved: string | null
  citizen_satisfaction: number | null
  community_verification_score: number | null
  created_by: string
  priority?: string
  gcc_ticket_ref?: string | null
}
import {
  calculateSERI,
  getRecurrenceByWard,
  getSilentZones,
  getMonthlyUnresolved,
  getVerificationStats,
} from "./analytics"

function formatDateNow(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
}

export function downloadCSV(complaints: ExportComplaint[]) {
  const headers = [
    "Complaint ID",
    "Ward",
    "Type",
    "Description",
    "Latitude",
    "Longitude",
    "Date Reported",
    "Date Resolved",
    "Status",
    "Satisfaction",
    "Verification Score",
    "Created By",
  ]
  const rows = complaints.map((c) => [
    c.complaint_id,
    c.ward,
    c.complaint_type,
    `"${c.description.replace(/"/g, '""')}"`,
    c.latitude?.toString() || "",
    c.longitude?.toString() || "",
    c.date_reported,
    c.date_resolved || "",
    c.status,
    c.citizen_satisfaction?.toString() || "",
    c.community_verification_score?.toString() || "",
    c.created_by,
  ])
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `complaints_${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadExcel(complaints: ExportComplaint[]) {
  const headers = [
    "Complaint ID",
    "Ward",
    "Type",
    "Description",
    "Latitude",
    "Longitude",
    "Date Reported",
    "Date Resolved",
    "Status",
    "Satisfaction",
    "Verification Score",
    "Created By",
  ]
  let xml =
    '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Complaints"><Table>'
  xml += "<Row>" + headers.map((h) => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join("") + "</Row>"
  complaints.forEach((c) => {
    xml += "<Row>"
    xml += `<Cell><Data ss:Type="String">${c.complaint_id}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.ward}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.complaint_type}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.description.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`
    xml += `<Cell><Data ss:Type="Number">${c.latitude ?? ""}</Data></Cell>`
    xml += `<Cell><Data ss:Type="Number">${c.longitude ?? ""}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.date_reported}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.date_resolved || ""}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.status}</Data></Cell>`
    xml += `<Cell><Data ss:Type="Number">${c.citizen_satisfaction ?? ""}</Data></Cell>`
    xml += `<Cell><Data ss:Type="Number">${c.community_verification_score ?? ""}</Data></Cell>`
    xml += `<Cell><Data ss:Type="String">${c.created_by}</Data></Cell>`
    xml += "</Row>"
  })
  xml += "</Table></Worksheet></Workbook>"
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `complaints_${Date.now()}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function downloadPDFReport(complaints: ExportComplaint[]) {
  const total = complaints.length
  const resolved = complaints.filter((c) => c.status === "Resolved").length
  const active = complaints.filter((c) => c.status !== "Resolved").length
  const escalated = complaints.filter((c) => c.status === "Escalated").length
  const recurrence = getRecurrenceByWard(complaints)
  const silentZones = getSilentZones(complaints)
  const monthlyUnresolved = getMonthlyUnresolved(complaints)
  const verificationStats = getVerificationStats(complaints)

  const seriData = WARDS.map((ward) => {
    const seri = calculateSERI(complaints, ward)
    return { ward, ...seri }
  }).sort((a, b) => a.score - b.score)

  const silentCount = silentZones.filter((z) => z.isSilent).length

  const html = `<!DOCTYPE html>
<html>
<head>
<title>Ward Governance Report</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a2e; }
  h1 { color: #1a3a5c; border-bottom: 3px solid #1a3a5c; padding-bottom: 10px; }
  h2 { color: #2a6a4a; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin: 15px 0; }
  th, td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  th { background: #1a3a5c; color: white; }
  tr:nth-child(even) { background: #f8f9fa; }
  .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
  .stat { background: #f0f4f8; padding: 15px 20px; border-radius: 8px; min-width: 120px; }
  .stat-number { font-size: 28px; font-weight: bold; color: #1a3a5c; }
  .stat-label { font-size: 12px; color: #666; }
  .risk-high { color: #dc2626; font-weight: bold; }
  .risk-moderate { color: #d97706; font-weight: bold; }
  .risk-good { color: #16a34a; font-weight: bold; }
  .alert { background: #fef2f2; border: 1px solid #fecaca; padding: 12px 16px; border-radius: 8px; margin: 15px 0; color: #dc2626; }
  .footer { margin-top: 40px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
<h1>Sanitation Co-Governance Intelligence Platform</h1>
<h2>Ward Governance Report</h2>
<p><strong>Generated:</strong> ${formatDateNow()}</p>

<h2>Summary</h2>
<div class="summary">
  <div class="stat"><div class="stat-number">${total}</div><div class="stat-label">Total Complaints</div></div>
  <div class="stat"><div class="stat-number">${active}</div><div class="stat-label">Active</div></div>
  <div class="stat"><div class="stat-number">${resolved}</div><div class="stat-label">Resolved</div></div>
  <div class="stat"><div class="stat-number">${escalated}</div><div class="stat-label">Escalated</div></div>
  <div class="stat"><div class="stat-number">${silentCount}</div><div class="stat-label">Silent Zones</div></div>
  <div class="stat"><div class="stat-number">${monthlyUnresolved.length}</div><div class="stat-label">30d+ Unresolved</div></div>
</div>

${monthlyUnresolved.length > 0 ? `<div class="alert"><strong>Governance Risk:</strong> ${monthlyUnresolved.length} complaint(s) have been unresolved for over 30 days.</div>` : ""}

<h2>Ward SERI Ranking</h2>
<table>
  <tr><th>Rank</th><th>Ward</th><th>SERI Score</th><th>Recurrence %</th><th>Avg Res. Time (days)</th><th>Avg Satisfaction</th><th>Avg Verification</th><th>Risk Level</th></tr>
  ${seriData
    .map(
      (w, i) =>
        `<tr><td>${i + 1}</td><td>${w.ward}</td><td>${w.score}</td><td>${w.recurrence}%</td><td>${w.avgResTime}</td><td>${w.avgSat}/5</td><td>${w.avgVerification}/5</td><td class="${w.score < 40 ? "risk-high" : w.score < 70 ? "risk-moderate" : "risk-good"}">${w.score < 40 ? "High Risk" : w.score < 70 ? "Moderate" : "Good"}</td></tr>`
    )
    .join("")}
</table>

<h2>Recurrence Statistics</h2>
<table>
  <tr><th>Ward</th><th>Total Complaints</th><th>Recurring Types</th><th>Top Recurring</th><th>Count</th></tr>
  ${recurrence.map((r) => `<tr><td>${r.ward}</td><td>${r.total}</td><td>${r.recurringTypes}</td><td>${r.topRecurring}</td><td>${r.topCount}</td></tr>`).join("")}
</table>

<h2>Silent Zone Summary</h2>
<table>
  <tr><th>Ward</th><th>Recent (30d)</th><th>Previous (30d)</th><th>Drop %</th><th>Status</th></tr>
  ${silentZones.map((z) => `<tr><td>${z.ward}</td><td>${z.recentComplaints}</td><td>${z.previousComplaints}</td><td>${z.dropRatio}%</td><td class="${z.isSilent ? "risk-high" : "risk-good"}">${z.isSilent ? "Silent Zone" : "Active"}</td></tr>`).join("")}
</table>

<h2>Monthly Unresolved Analysis</h2>
${monthlyUnresolved.length === 0 ? "<p>All complaints are within SLA threshold.</p>" : `
<table>
  <tr><th>Complaint ID</th><th>Ward</th><th>Type</th><th>Date Reported</th><th>Status</th></tr>
  ${monthlyUnresolved.map((c) => `<tr><td>${c.complaint_id}</td><td>${c.ward}</td><td>${c.complaint_type}</td><td>${c.date_reported}</td><td class="risk-high">${c.status}</td></tr>`).join("")}
</table>
`}

<h2>Verification Statistics</h2>
<div class="summary">
  <div class="stat"><div class="stat-number">${verificationStats.totalVerified}</div><div class="stat-label">Total Verified</div></div>
  <div class="stat"><div class="stat-number">${verificationStats.avgScore}/5</div><div class="stat-label">Avg Score</div></div>
  <div class="stat"><div class="stat-number">${verificationStats.lowQuality}</div><div class="stat-label">Low Quality Flagged</div></div>
  <div class="stat"><div class="stat-number">${verificationStats.reopened}</div><div class="stat-label">Reopened</div></div>
</div>

<div class="footer">
  <p>Sanitation Co-Governance Intelligence Platform &mdash; Auto-generated report | ${formatDateNow()}</p>
</div>
</body>
</html>`

  const win = window.open("", "_blank")
  if (win) {
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 500)
  }
}
