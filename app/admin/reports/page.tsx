"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { WARDS } from "@/lib/types"
import {
  calculateSERI,
  getRiskBadge,
  getRecurrenceByWard,
  getSilentZones,
  getVerificationStats,
} from "@/lib/analytics"
import { downloadCSV, downloadExcel, downloadPDFReport } from "@/lib/export"
import {
  FileSpreadsheet,
  FileText,
  FileDown,
  Download,
  CheckCircle,
  Shield,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

export default function AdminReports() {
  const { complaints } = useStore()
  const [downloadingCSV, setDownloadingCSV] = useState(false)
  const [downloadingExcel, setDownloadingExcel] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)

  const total = complaints.length
  const resolved = complaints.filter((c) => c.status === "Resolved").length
  const active = total - resolved
  const escalated = complaints.filter((c) => c.status === "Escalated").length
  const silentCount = getSilentZones(complaints).filter((z) => z.isSilent).length
  const recurrenceData = getRecurrenceByWard(complaints)
  const recurringWards = recurrenceData.filter((r) => r.recurringTypes > 0).length
  const verificationStats = getVerificationStats(complaints)

  const seriData = WARDS.map((ward) => {
    const seri = calculateSERI(complaints, ward)
    const risk = getRiskBadge(seri.score)
    return { ward, ...seri, risk }
  }).sort((a, b) => a.score - b.score)

  function handleCSV() {
    setDownloadingCSV(true)
    setTimeout(() => {
      downloadCSV(complaints)
      toast.success("CSV file downloaded successfully!")
      setDownloadingCSV(false)
    }, 500)
  }

  function handleExcel() {
    setDownloadingExcel(true)
    setTimeout(() => {
      downloadExcel(complaints)
      toast.success("Excel file downloaded successfully!")
      setDownloadingExcel(false)
    }, 500)
  }

  function handlePDF() {
    setDownloadingPDF(true)
    setTimeout(() => {
      downloadPDFReport(complaints)
      toast.success("PDF report generated successfully!")
      setDownloadingPDF(false)
    }, 500)
  }

  return (
    <DashboardShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Export</h1>
          <p className="text-muted-foreground">
            Download data exports and generate performance reports
          </p>
        </div>

        {/* Export Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
                <FileText className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">CSV Export</h3>
                <p className="text-sm text-muted-foreground">Download all complaints as CSV</p>
              </div>
              <Button
                onClick={handleCSV}
                disabled={downloadingCSV || complaints.length === 0}
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                {downloadingCSV ? "Downloading..." : "Download CSV"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-accent/10">
                <FileSpreadsheet className="w-7 h-7 text-accent" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">Excel Export</h3>
                <p className="text-sm text-muted-foreground">Download as Excel workbook</p>
              </div>
              <Button
                onClick={handleExcel}
                disabled={downloadingExcel || complaints.length === 0}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                {downloadingExcel ? "Downloading..." : "Download Excel"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-6">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-destructive/10">
                <FileDown className="w-7 h-7 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-foreground">PDF Report</h3>
                <p className="text-sm text-muted-foreground">Generate ward governance report</p>
              </div>
              <Button
                onClick={handlePDF}
                disabled={downloadingPDF || complaints.length === 0}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="w-4 h-4" />
                {downloadingPDF ? "Generating..." : "Generate PDF"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Summary for Reports */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Report Summary
              </CardTitle>
              <CardDescription>Data overview for report generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total Complaints</span>
                  <span className="font-bold text-foreground">{total}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Active Complaints</span>
                  <span className="font-bold text-foreground">{active}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Resolved Complaints</span>
                  <span className="font-bold text-foreground">{resolved}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Escalated</span>
                  <span className="font-bold text-destructive">{escalated}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Resolution Rate</span>
                  <span className="font-bold text-foreground">
                    {total > 0 ? Math.round((resolved / total) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Recurring Wards</span>
                  <span className="font-bold text-foreground">{recurringWards}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Silent Zones</span>
                  <span className="font-bold text-foreground">{silentCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Verification Summary
              </CardTitle>
              <CardDescription>Community verification statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Total Verified</span>
                  <span className="font-bold text-foreground">{verificationStats.totalVerified}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Avg Verification Score</span>
                  <span className="font-bold text-foreground">{verificationStats.avgScore}/5</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-sm text-muted-foreground">Low Quality Flagged</span>
                  <span className="font-bold text-destructive">{verificationStats.lowQuality}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">Reopened Complaints</span>
                  <span className="font-bold text-destructive">{verificationStats.reopened}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent" />
                SERI Rankings
              </CardTitle>
              <CardDescription>Ward equity and risk scores</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {seriData.map((w, i) => (
                  <div
                    key={w.ward}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-sm font-medium text-muted-foreground">
                        #{i + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground">{w.ward}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{w.score}</span>
                      <Badge
                        className={
                          w.risk.color === "destructive"
                            ? "bg-destructive text-destructive-foreground"
                            : w.risk.color === "warning"
                              ? "bg-warning text-warning-foreground"
                              : "bg-success text-success-foreground"
                        }
                      >
                        {w.risk.label}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
