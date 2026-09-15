"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard-shell"
import { ComplaintTimeline } from "@/components/complaint-timeline"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Star,
  Filter,
  MapPin,
  ExternalLink,
  Image as ImageIcon,
  ShieldCheck,
  Eye,
  CheckCircle2,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"

const STATUS_STYLES: Record<string, string> = {
  Closed: "bg-success text-success-foreground",
  Resolved: "bg-success text-success-foreground",
  Escalated: "bg-destructive text-destructive-foreground",
  Rejected: "bg-destructive/10 text-destructive",
  "In Progress": "bg-warning text-warning-foreground",
  Verified: "bg-primary/15 text-primary",
  Assigned: "bg-primary/15 text-primary",
  SentToCorporation: "bg-primary/10 text-primary",
  Pending: "bg-muted text-muted-foreground",
}

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-warning text-warning-foreground",
  Medium: "bg-primary/15 text-primary",
  Low: "bg-muted text-muted-foreground",
}

function StatusBadge({ status }: { status: string }) {
  return <Badge className={STATUS_STYLES[status] ?? "bg-muted"}>{status}</Badge>
}

function RatingDialog({
  complaintId,
  currentRating,
}: {
  complaintId: string
  currentRating: number | null
}) {
  const { rateSatisfaction } = useStore()
  const [rating, setRating] = useState(currentRating || 0)
  const [open, setOpen] = useState(false)

  async function handleRate() {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5")
      return
    }
    await rateSatisfaction(complaintId, rating)
    toast.success("Thank you for your feedback!")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Star className="w-3 h-3" />
          {currentRating ? `${currentRating}/5` : "Rate"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate Your Satisfaction</DialogTitle>
          <DialogDescription>
            How satisfied are you with the resolution of this complaint?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className="p-1 transition-colors"
                aria-label={`Rate ${star} stars`}
              >
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= rating ? "fill-warning text-warning" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <Button onClick={handleRate} disabled={rating === 0}>
            Submit Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmRejectDialog({
  complaintId,
}: {
  complaintId: string
}) {
  const { confirmResolution } = useStore()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"confirm" | "reject" | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  async function submit(accept: boolean) {
    setBusy(true)
    const ok = await confirmResolution(complaintId, accept, note || undefined)
    setBusy(false)
    if (ok) {
      toast.success(accept ? "Confirmed — thank you! (+5 trust points)" : "Rejected — complaint reopened for rework")
      setOpen(false)
      setMode(null)
      setNote("")
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o) {
          setMode(null)
          setNote("")
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 border-success/40 text-success">
          <ShieldCheck className="w-3 h-3" /> Confirm
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "reject" ? "Reject Resolution" : "Confirm Resolution"}</DialogTitle>
          <DialogDescription>
            {mode === "reject"
              ? "Tell us what is still wrong — the complaint will be reopened and the department notified."
              : "Confirm the work was done properly to close this complaint and earn trust points."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          {!mode ? (
            <div className="flex gap-3 justify-center py-2">
              <Button className="gap-2" onClick={() => setMode("confirm")}>
                <CheckCircle2 className="w-4 h-4" /> Work done properly
              </Button>
              <Button variant="destructive" className="gap-2" onClick={() => setMode("reject")}>
                <RotateCcw className="w-4 h-4" /> Not fixed — reopen
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                placeholder={mode === "reject" ? "What is still wrong? (optional)" : "Any feedback? (optional)"}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setMode(null)}>Back</Button>
                <Button
                  variant={mode === "reject" ? "destructive" : "default"}
                  disabled={busy}
                  onClick={() => submit(mode === "confirm")}
                >
                  {mode === "confirm" ? "Confirm & Close" : "Reject & Reopen"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
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
        <img src={photo} alt="Complaint full size" className="w-full rounded-lg border border-border" />
      </DialogContent>
    </Dialog>
  )
}

export default function CitizenComplaints() {
  const { currentUser, complaints } = useStore()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [wardFilter, setWardFilter] = useState<string>("all")
  const [viewing, setViewing] = useState<string | null>(null)

  const viewed = complaints.find((c) => c.complaint_id === viewing)
  const allMyComplaints = complaints.filter((c) => c.created_by === currentUser?.email)
  const myComplaints = allMyComplaints
    .filter((c) => statusFilter === "all" || c.status === statusFilter)
    .filter((c) => wardFilter === "all" || c.ward === wardFilter)

  const uniqueWards = [...new Set(allMyComplaints.map((c) => c.ward))]
  const statusOptions = [
    "Pending",
    "SentToCorporation",
    "Verified",
    "Assigned",
    "In Progress",
    "Resolved",
    "Closed",
    "Escalated",
    "Rejected",
  ]

  return (
    <DashboardShell requiredRole="citizen">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Complaints</h1>
          <p className="text-muted-foreground">Track every complaint live — from submission to closure</p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 p-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={wardFilter} onValueChange={setWardFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {uniqueWards.map((w) => (
                  <SelectItem key={w} value={w}>{w}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Complaints Table */}
        <Card>
          <CardHeader>
            <CardTitle>Complaints ({myComplaints.length})</CardTitle>
            <CardDescription>All complaints you have submitted</CardDescription>
          </CardHeader>
          <CardContent>
            {myComplaints.length === 0 ? (
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
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Ward</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Ticket</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Photo</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">GPS</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myComplaints].reverse().map((c) => (
                      <tr key={c.complaint_id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2 font-mono text-xs">{c.complaint_id.slice(0, 12)}…</td>
                        <td className="py-3 px-2">
                          <Badge className={PRIORITY_STYLES[c.priority] ?? "bg-muted"}>{c.priority}</Badge>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.ward}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.complaint_type}</td>
                        <td className="py-3 px-2 font-mono text-xs">{c.gcc_ticket_ref ?? "—"}</td>
                        <td className="py-3 px-2">
                          {c.photo ? (
                            <PhotoDialog photo={c.photo} />
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
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
                        <td className="py-3 px-2"><StatusBadge status={c.status} /></td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => setViewing(c.complaint_id)}>
                              <Eye className="w-3.5 h-3.5" /> Track
                            </Button>
                            {c.status === "Resolved" && (
                              <>
                                <ConfirmRejectDialog complaintId={c.complaint_id} />
                                <RatingDialog complaintId={c.complaint_id} currentRating={c.citizen_satisfaction} />
                              </>
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

        {/* Timeline dialog */}
        <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Live Complaint Timeline</DialogTitle>
              <DialogDescription className="font-mono text-xs">{viewed?.complaint_id}</DialogDescription>
            </DialogHeader>
            {viewed && <ComplaintTimeline complaint={viewed} />}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardShell>
  )
}
