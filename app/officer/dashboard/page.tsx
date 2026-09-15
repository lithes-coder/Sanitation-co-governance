"use client"

import { useState, useRef, useMemo } from "react"
import { useStore } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard-shell"
import { ComplaintTimeline } from "@/components/complaint-timeline"
import { WardMap } from "@/components/ward-map"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DEPARTMENT_LIST } from "@/lib/types"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import {
  Inbox,
  Clock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  XCircle,
  AlertTriangle,
  UserCheck,
  Wrench,
  Camera,
  Building2,
  Eye,
  MapPin,
} from "lucide-react"

const PRIORITY_ORDER: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-warning text-warning-foreground",
  Medium: "bg-primary/15 text-primary",
  Low: "bg-muted text-muted-foreground",
}

function SlaBadge({ due, status }: { due: string | null; status: string }) {
  if (!due || ["Resolved", "Closed", "Rejected"].includes(status)) return <span className="text-xs text-muted-foreground">—</span>
  const ms = new Date(due).getTime() - Date.now()
  const breached = ms <= 0
  const hrs = Math.floor(Math.abs(ms) / 3600000)
  const mins = Math.floor((Math.abs(ms) % 3600000) / 60000)
  return (
    <Badge variant="outline" className={breached ? "text-destructive border-destructive/40 animate-pulse" : ""}>
      <Clock className="w-3 h-3 mr-1" />
      {breached ? `overdue ${hrs}h` : `${hrs}h ${mins}m`}
    </Badge>
  )
}

export default function OfficerDashboard() {
  const { currentUser, complaints, verifyByOfficer, assignComplaint, resolveComplaint } = useStore()
  const [viewing, setViewing] = useState<string | null>(null)
  const [resolving, setResolving] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [verifyNote, setVerifyNote] = useState("")
  const [resolveNote, setResolveNote] = useState("")
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null)
  const [assignDept, setAssignDept] = useState<string>("")
  const [wardFilter, setWardFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const fileRef = useRef<HTMLInputElement>(null)

  const viewed = complaints.find((c) => c.complaint_id === viewing)
  const resolvingC = complaints.find((c) => c.complaint_id === resolving)
  const assigningC = complaints.find((c) => c.complaint_id === assigning)

  const inbox = useMemo(
    () =>
      complaints
        .filter((c) => !["Closed", "Rejected"].includes(c.status))
        .filter((c) => wardFilter === "all" || c.ward === wardFilter)
        .filter((c) => priorityFilter === "all" || c.priority === priorityFilter)
        .sort((a, b) => {
          const p = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
          if (p !== 0) return p
          return new Date(a.sla_due_at ?? a.date_reported).getTime() - new Date(b.sla_due_at ?? b.date_reported).getTime()
        }),
    [complaints, wardFilter, priorityFilter]
  )

  const verifiedCount = complaints.filter((c) => c.verification_status === "Verified").length
  const overdue = complaints.filter(
    (c) =>
      c.sla_due_at &&
      !["Resolved", "Closed", "Rejected"].includes(c.status) &&
      new Date(c.sla_due_at).getTime() < Date.now()
  ).length
  const acked = complaints.filter((c) => c.acked_at)
  const avgAckMins =
    acked.length > 0
      ? Math.round(
          acked.reduce(
            (s, c) => s + (new Date(c.acked_at!).getTime() - new Date(c.date_reported).getTime()) / 60000,
            0
          ) / acked.length
        )
      : 0

  const wards = [...new Set(complaints.map((c) => c.ward))]

  function resetResolve() {
    setResolveNote("")
    setAfterPhoto(null)
    setResolving(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleAfterPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => setAfterPhoto(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <DashboardShell requiredRole="officer">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Corporation Officer Portal</h1>
          <p className="text-muted-foreground">
            Verify, route and resolve citizen complaints — {currentUser?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="In Inbox" value={inbox.length} icon={Inbox} color="primary" />
          <KPICard title="Verified" value={verifiedCount} icon={ShieldCheck} color="accent" />
          <KPICard title="Overdue" value={overdue} icon={AlertTriangle} color="warning" />
          <KPICard title="Avg Ack" value={avgAckMins > 0 ? `${avgAckMins}m` : "—"} icon={TrendingUp} color="primary" />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <Inbox className="w-4 h-4 text-muted-foreground" />
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {wards.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Inbox */}
        <Card>
          <CardHeader>
            <CardTitle>Priority Inbox ({inbox.length})</CardTitle>
            <CardDescription>Critical first, then closest SLA deadline</CardDescription>
          </CardHeader>
          <CardContent>
            {inbox.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Inbox clear. Nothing needs attention.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      {["ID", "Priority", "Ward", "Type", "Ticket", "SLA", "Age", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left py-3 px-2 font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {inbox.map((c) => (
                      <tr key={c.complaint_id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2 font-mono text-xs">{c.complaint_id.slice(0, 12)}…</td>
                        <td className="py-3 px-2">
                          <Badge className={PRIORITY_STYLES[c.priority] ?? "bg-muted"}>{c.priority}</Badge>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.ward}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.complaint_type}</td>
                        <td className="py-3 px-2 font-mono text-xs">{c.gcc_ticket_ref ?? "—"}</td>
                        <td className="py-3 px-2"><SlaBadge due={c.sla_due_at} status={c.status} /></td>
                        <td className="py-3 px-2 text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(c.date_reported), { addSuffix: true })}
                        </td>
                        <td className="py-3 px-2 text-xs">{c.status}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="icon" className="w-7 h-7" onClick={() => setViewing(c.complaint_id)} aria-label="View timeline">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            {c.verification_status !== "Verified" && !["Rejected"].includes(c.status) && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1"
                                  onClick={async () => {
                                    const ok = await verifyByOfficer(c.complaint_id, "Genuine", verifyNote || undefined)
                                    if (ok) toast.success("Verified as genuine — citizen notified")
                                  }}
                                >
                                  <ShieldCheck className="w-3.5 h-3.5" /> Verify
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 gap-1 text-destructive"
                                  onClick={async () => {
                                    const ok = await verifyByOfficer(c.complaint_id, "Spam", verifyNote || undefined)
                                    if (ok) toast.success("Marked as spam")
                                  }}
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Spam
                                </Button>
                              </>
                            )}
                            {c.verification_status === "Verified" && c.status !== "Assigned" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1"
                                onClick={() => {
                                  setAssigning(c.complaint_id)
                                  setAssignDept(c.department || DEPARTMENT_LIST[0])
                                }}
                              >
                                <Building2 className="w-3.5 h-3.5" /> Assign
                              </Button>
                            )}
                            {["Assigned", "Verified", "In Progress"].includes(c.status) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 gap-1"
                                onClick={() => setResolving(c.complaint_id)}
                              >
                                <Wrench className="w-3.5 h-3.5" /> Resolve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live field map — every complaint, GPS pins + ward approximations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Live Field Map
            </CardTitle>
            <CardDescription>
              Click any pin for full complaint details — photo, exact location, ticket & department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WardMap complaints={inbox} />
          </CardContent>
        </Card>

        {/* Timeline viewer */}
        <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complaint Timeline</DialogTitle>
              <DialogDescription className="font-mono text-xs">{viewed?.complaint_id}</DialogDescription>
            </DialogHeader>
            {viewed && <ComplaintTimeline complaint={viewed} />}
          </DialogContent>
        </Dialog>

        {/* Assign dialog */}
        <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign to Department</DialogTitle>
              <DialogDescription>Route this verified complaint to the responsible agency</DialogDescription>
            </DialogHeader>
            {assigningC && (
              <div className="flex flex-col gap-4 py-2">
                <div className="text-sm text-muted-foreground">
                  {assigningC.complaint_type} · {assigningC.ward} · {assigningC.priority}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Department</Label>
                  <Select value={assignDept} onValueChange={setAssignDept}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENT_LIST.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={async () => {
                    if (!assignDept) return
                    const ok = await assignComplaint(assigningC.complaint_id, assignDept)
                    if (ok) {
                      toast.success(`Assigned to ${assignDept} — citizen notified`)
                      setAssigning(null)
                    }
                  }}
                >
                  <UserCheck className="w-4 h-4 mr-2" /> Confirm Assignment
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Resolve dialog */}
        <Dialog open={!!resolving} onOpenChange={(o) => !o && resetResolve()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mark Resolved</DialogTitle>
              <DialogDescription>Describe the work done and attach after-photo evidence</DialogDescription>
            </DialogHeader>
            {resolvingC && (
              <div className="flex flex-col gap-4 py-2">
                <div className="text-sm text-muted-foreground">
                  {resolvingC.complaint_type} · {resolvingC.ward} · {resolvingC.gcc_ticket_ref}
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Work done *</Label>
                  <Textarea
                    placeholder="e.g. drain desilted and flushed, site cleared..."
                    value={resolveNote}
                    onChange={(e) => setResolveNote(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4" /> After photo (evidence)
                  </Label>
                  <Input ref={fileRef} type="file" accept="image/*" onChange={handleAfterPhoto} className="cursor-pointer" />
                  {afterPhoto && (
                    <img src={afterPhoto} alt="After" className="w-full max-w-xs h-36 object-cover rounded-lg border border-border" />
                  )}
                </div>
                <Button
                  onClick={async () => {
                    if (!resolveNote.trim()) {
                      toast.error("Please describe the work done")
                      return
                    }
                    const ok = await resolveComplaint(resolvingC.complaint_id, resolveNote.trim(), afterPhoto)
                    if (ok) {
                      toast.success("Resolved — citizen asked to confirm")
                      resetResolve()
                    }
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Resolved
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
