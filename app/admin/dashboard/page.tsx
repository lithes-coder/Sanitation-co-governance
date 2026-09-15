"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { DashboardShell } from "@/components/dashboard-shell"
import { SanitationAIChat } from "@/components/sanitation-ai-chat"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { WARDS } from "@/lib/types"
import {
  calculateSERI,
  getRiskBadge,
  getSilentZones,
  getMonthlyUnresolved,
  getGovernanceRiskWards,
} from "@/lib/analytics"
import type { ComplaintStatus } from "@/lib/types"
import {
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  EyeOff,
  TrendingDown,
  ArrowUpDown,
  Filter,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  Zap,
  CalendarX,
} from "lucide-react"
import { toast } from "sonner"

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "Resolved" || status === "Closed"
      ? "bg-success text-success-foreground"
      : status === "Escalated"
        ? "bg-destructive text-destructive-foreground"
        : status === "In Progress"
          ? "bg-warning text-warning-foreground"
          : status === "Rejected"
            ? "bg-destructive/10 text-destructive"
            : "bg-primary/10 text-primary"
  return <Badge className={className}>{status}</Badge>
}

function PhotoDialog({ photo }: { photo: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative group cursor-pointer">
          <img
            src={photo}
            alt="Complaint"
            className="w-10 h-10 object-cover rounded border border-border"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 rounded transition-colors flex items-center justify-center">
            <ImageIcon className="w-3 h-3 text-background opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Complaint Photo</DialogTitle>
        </DialogHeader>
        <img
          src={photo}
          alt="Complaint full size"
          className="w-full rounded-lg border border-border"
        />
      </DialogContent>
    </Dialog>
  )
}

export default function AdminDashboard() {
  const router = useRouter()

  const {
    currentUser,
    complaints,
    updateStatus,
    lastUpdated,
    importLegacy,
  } = useStore()

  const [statusFilter, setStatusFilter] = useState("all")
  const [wardFilter, setWardFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("all")

  useEffect(() => {
  if (!currentUser) {
    router.replace("/login")
    return
  }

  if (currentUser.role !== "admin") {
    toast.error("Access Denied")
    router.replace("/citizen/dashboard")
  }
}, [currentUser, router])

if (!currentUser) {
  return null
}

if (currentUser.role !== "admin") {
  return null
}
  

  const total = complaints.length
  const active = complaints.filter((c) => c.status !== "Resolved").length
  const resolved = complaints.filter((c) => c.status === "Resolved").length
  const escalated = complaints.filter((c) => c.status === "Escalated").length
  const monthlyUnresolved = getMonthlyUnresolved(complaints).length
  const governanceRiskWards = getGovernanceRiskWards(complaints)

  // Recurring wards
  const recurringWards = WARDS.filter((ward) => {
    const wc = complaints.filter((c) => c.ward === ward)
    const types: Record<string, number> = {}
    wc.forEach((c) => {
      types[c.complaint_type] = (types[c.complaint_type] || 0) + 1
    })
    return Object.values(types).some((v) => v > 1)
  }).length

  const silentZones = getSilentZones(complaints).filter((z) => z.isSilent).length
  const lowSeri = WARDS.filter((ward) => calculateSERI(complaints, ward).score < 40).length

  const filteredComplaints = complaints
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => wardFilter === "all" || c.ward === wardFilter)
    .filter((c) => userFilter === "all" || c.created_by === userFilter)

  const citizenEmails = [...new Set(complaints.map((c) => c.created_by))]

  async function handleStatusChange(id: string, newStatus: ComplaintStatus) {
    await updateStatus(id, newStatus)
    toast.success(`Complaint status updated to ${newStatus}`)
  }

  async function handleImportLegacy() {
    const n = await importLegacy()
    if (n > 0) toast.success(`Imported ${n} legacy complaint(s) into the live database`)
    else toast.info("No legacy data found in this browser")
  }

  // SERI monitoring
  const seriData = WARDS.map((ward) => {
    const seri = calculateSERI(complaints, ward)
    const risk = getRiskBadge(seri.score)
    return { ward, ...seri, risk }
  }).sort((a, b) => a.score - b.score)

  return (
    <DashboardShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of sanitation governance across all wards
            </p>
          </div>
          <div className="flex items-center gap-3">
            {total === 0 && (
              <Button size="sm" variant="outline" onClick={handleImportLegacy}>
                Import legacy data
              </Button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Live • Updated {Math.round((Date.now() - lastUpdated.getTime()) / 1000)}s ago
            </div>
          </div>
        </div>

        {/* Alert Banner: Monthly Unresolved */}
        {monthlyUnresolved > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-destructive">
                Governance Risk Alert
              </span>
              <span className="text-sm text-destructive/80">
                {monthlyUnresolved} complaint(s) have been unresolved for over 30 days.
                {governanceRiskWards.length > 0 && (
                  <span>
                    {" "}Affected wards:{" "}
                    {governanceRiskWards.map((w, i) => (
                      <Badge key={w} className="bg-destructive text-destructive-foreground mx-0.5">
                        {w}
                      </Badge>
                    ))}
                  </span>
                )}
              </span>
            </div>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4">
          <KPICard title="Total Complaints" value={total} icon={FileText} color="primary" />
          <KPICard title="Active" value={active} icon={Clock} color="warning" />
          <KPICard title="Resolved" value={resolved} icon={CheckCircle} color="accent" />
          <KPICard title="Escalated" value={escalated} icon={Zap} color="destructive" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Recurring Wards" value={recurringWards} icon={AlertTriangle} color="destructive" />
          <KPICard title="Silent Zones" value={silentZones} icon={EyeOff} color="destructive" />
          <KPICard title="Low SERI Wards" value={lowSeri} icon={TrendingDown} color="destructive" />
          <KPICard title="30d+ Unresolved" value={monthlyUnresolved} icon={CalendarX} color="destructive" />
        </div>

        {/* SERI Monitoring */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary" />
              SERI Monitoring
            </CardTitle>
            <CardDescription>
              Sanitation Equity & Risk Index scores by ward (auto-updated)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {seriData.map((w) => (
                <div
                  key={w.ward}
                  className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{w.ward}</span>
                    <div className="flex items-center gap-1">
                      {governanceRiskWards.includes(w.ward) && (
                        <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5">
                          Risk
                        </Badge>
                      )}
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
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold text-foreground">{w.score}</span>
                    <span className="text-sm text-muted-foreground mb-1">/100</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        w.score < 40 ? "bg-destructive" : w.score < 70 ? "bg-warning" : "bg-success"
                      }`}
                      style={{ width: `${w.score}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>Recurrence: {w.recurrence}%</span>
                    <span>Res. Time: {w.avgResTime}d</span>
                    <span>Satisfaction: {w.avgSat}/5</span>
                    <span>Verification: {w.avgVerification}/5</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Complaint Management */}
        <Card>
          <CardHeader>
            <CardTitle>Complaint Management</CardTitle>
            <CardDescription>View and manage all complaints</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-border">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={wardFilter} onValueChange={setWardFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Ward" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wards</SelectItem>
                  {WARDS.map((w) => (
                    <SelectItem key={w} value={w}>{w}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="SentToCorporation">Sent to Corporation</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Assigned">Assigned</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Escalated">Escalated</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {citizenEmails.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredComplaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No complaints match your filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">ID</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Priority</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Ticket</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Photo</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Ward</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">User</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">GPS</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Rating</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Verify</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...filteredComplaints].reverse().map((c) => (
                      <tr key={c.complaint_id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2 font-mono text-xs">{c.complaint_id.slice(0, 16)}</td>
                        <td className="py-3 px-2">
                          <Badge
                            className={
                              c.priority === "Critical"
                                ? "bg-destructive text-destructive-foreground"
                                : c.priority === "High"
                                  ? "bg-warning text-warning-foreground"
                                  : "bg-muted text-muted-foreground"
                            }
                          >
                            {c.priority}
                          </Badge>
                        </td>
                        <td className="py-3 px-2 font-mono text-xs">{c.gcc_ticket_ref ?? "-"}</td>
                        <td className="py-3 px-2">
                          {c.photo ? (
                            <PhotoDialog photo={c.photo} />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.ward}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.complaint_type}</td>
                        <td className="py-3 px-2 text-muted-foreground text-xs">{c.created_by}</td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {c.date_reported.split("T")[0]}
                        </td>
                        <td className="py-3 px-2">
                          {c.latitude && c.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-primary text-xs hover:underline"
                            >
                              <MapPin className="w-3 h-3" />
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {c.citizen_satisfaction ? `${c.citizen_satisfaction}/5` : "-"}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {c.community_verification_score
                            ? `${c.community_verification_score}/5`
                            : "-"}
                        </td>
                        <td className="py-3 px-2">
                          {!["Resolved", "Closed", "Rejected"].includes(c.status) ? (
                            <div className="flex gap-1">
                              {["Pending", "SentToCorporation", "Verified", "Assigned", "Escalated"].includes(c.status) && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(c.complaint_id, "In Progress")}
                                >
                                  Start
                                </Button>
                              )}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90">
                                    Resolve
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Resolve Complaint</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will mark the complaint as resolved and record the
                                      resolution date. Citizens will be notified.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleStatusChange(c.complaint_id, "Resolved")}
                                    >
                                      Confirm
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {c.date_resolved?.split("T")[0]}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <SanitationAIChat />
    </DashboardShell>
  )
}
