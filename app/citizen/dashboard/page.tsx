"use client"

import { useState, useRef, useCallback } from "react"
import { useStore } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard-shell"
import { SanitationAIChat } from "@/components/sanitation-ai-chat"
import { ComplaintTimeline } from "@/components/complaint-timeline"
import { KPICard } from "@/components/kpi-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { WARDS, COMPLAINT_TYPES } from "@/lib/types"
import { calculateSERI, getRiskBadge } from "@/lib/analytics"
import {
  FileText,
  Clock,
  CheckCircle,
  Star,
  Send,
  Shield,
  MapPin,
  Camera,
  X,
  Loader2,
  ExternalLink,
  AlertTriangle,
  Eye,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-warning text-warning-foreground",
  Medium: "bg-primary/15 text-primary",
  Low: "bg-muted text-muted-foreground",
}

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

function StatusBadge({ status }: { status: string }) {
  return <Badge className={STATUS_STYLES[status] ?? "bg-muted"}>{status}</Badge>
}

export default function CitizenDashboard() {
  const { currentUser, complaints, addComplaint } = useStore()
  const [ward, setWard] = useState("")
  const [type, setType] = useState("")
  const [description, setDescription] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [viewing, setViewing] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const viewed = complaints.find((c) => c.complaint_id === viewing)
  const myComplaints = complaints.filter((c) => c.created_by === currentUser?.email)
  const active = myComplaints.filter((c) => !["Resolved", "Closed", "Rejected"].includes(c.status)).length
  const resolved = myComplaints.filter((c) => ["Resolved", "Closed"].includes(c.status)).length
  const trustPoints = myComplaints.reduce((s, c) => s + (c.trust_points ?? 0), 0)
  const rated = myComplaints.filter((c) => c.citizen_satisfaction !== null)
  const avgSat =
    rated.length > 0
      ? (rated.reduce((s, c) => s + (c.citizen_satisfaction ?? 0), 0) / rated.length).toFixed(1)
      : "N/A"

  const captureGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocation is not supported by your browser")
      return
    }
    setGpsLoading(true)
    setGpsError("")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setGpsLoading(false)
        toast.success("GPS location captured!")
      },
      (err) => {
        setGpsError(err.message || "Failed to capture location")
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB")
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setPhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!ward || !type || !description.trim()) {
      toast.error("Please fill in all required fields")
      return
    }
    setSubmitting(true)
    const ok = await addComplaint({
      ward,
      type,
      description: description.trim(),
      photo,
      latitude,
      longitude,
    })
    setSubmitting(false)
    if (ok) {
      toast.success("Complaint submitted — forwarding to the Corporation", {
        description: "Severity scoring and department routing happen automatically. Track it live below.",
      })
      setWard("")
      setType("")
      setDescription("")
      setPhoto(null)
      setLatitude(null)
      setLongitude(null)
      setGpsError("")
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <DashboardShell requiredRole="citizen">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome, {currentUser?.name}
          </h1>
          <p className="text-muted-foreground">Report issues and watch the Corporation work on them live</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Submitted" value={myComplaints.length} icon={FileText} color="primary" />
          <KPICard title="Active" value={active} icon={Clock} color="warning" />
          <KPICard title="Resolved" value={resolved} icon={CheckCircle} color="accent" />
          <KPICard title="Avg Satisfaction" value={avgSat} icon={Star} color="primary" />
          <KPICard title="Trust Points" value={trustPoints} icon={Shield} color="accent" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Submit Complaint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-primary" />
                Submit New Complaint
              </CardTitle>
              <CardDescription>
                Severity is scored automatically — photo & GPS evidence boost priority
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Ward *</Label>
                  <Select value={ward} onValueChange={setWard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {WARDS.map((w) => (
                        <SelectItem key={w} value={w}>{w}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Complaint Type *</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMPLAINT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Description *</Label>
                  <Textarea
                    placeholder="Describe the issue in detail..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Photo Upload */}
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    Photo (optional, +10 severity)
                  </Label>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="cursor-pointer"
                  />
                  {photo && (
                    <div className="relative w-full max-w-xs">
                      <img
                        src={photo}
                        alt="Complaint photo preview"
                        className="w-full h-40 object-cover rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => {
                          setPhoto(null)
                          if (fileInputRef.current) fileInputRef.current.value = ""
                        }}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* GPS Capture */}
                <div className="flex flex-col gap-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    GPS Location (optional, +5 severity)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={captureGPS}
                      disabled={gpsLoading}
                      className="gap-1.5"
                    >
                      {gpsLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <MapPin className="w-3.5 h-3.5" />
                      )}
                      {gpsLoading ? "Capturing..." : latitude ? "Recapture GPS" : "Capture GPS"}
                    </Button>
                    {latitude && longitude && (
                      <span className="text-xs text-muted-foreground">
                        {latitude.toFixed(6)}, {longitude.toFixed(6)}
                      </span>
                    )}
                  </div>
                  {gpsError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {gpsError}
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full gap-2" disabled={submitting}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  {submitting ? "Scoring & routing…" : "Submit Complaint"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Ward Transparency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Ward Transparency
              </CardTitle>
              <CardDescription>SERI scores and risk levels per ward</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 max-h-[430px] overflow-y-auto pr-1">
                {WARDS.map((w) => {
                  const seri = calculateSERI(complaints, w)
                  const risk = getRiskBadge(seri.score)
                  return (
                    <div key={w} className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{w}</span>
                        <Badge
                          className={
                            risk.color === "destructive"
                              ? "bg-destructive text-destructive-foreground"
                              : risk.color === "warning"
                                ? "bg-warning text-warning-foreground"
                                : "bg-success text-success-foreground"
                          }
                        >
                          {risk.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">SERI: {seri.score}/100</span>
                        <span className="text-xs text-muted-foreground">Res. Efficiency: {seri.avgResTime}d</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            seri.score < 40
                              ? "bg-destructive"
                              : seri.score < 70
                                ? "bg-warning"
                                : "bg-success"
                          }`}
                          style={{ width: `${seri.score}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Complaints</CardTitle>
            <CardDescription>Your latest submissions — updates arrive live</CardDescription>
          </CardHeader>
          <CardContent>
            {myComplaints.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No complaints submitted yet. Use the form above to submit your first complaint.
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
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Timeline</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...myComplaints].reverse().slice(0, 8).map((c) => (
                      <tr key={c.complaint_id} className="border-b border-border last:border-0">
                        <td className="py-3 px-2 font-mono text-xs">{c.complaint_id.slice(0, 12)}…</td>
                        <td className="py-3 px-2">
                          <Badge className={PRIORITY_STYLES[c.priority] ?? "bg-muted"}>{c.priority}</Badge>
                        </td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.ward}</td>
                        <td className="py-3 px-2 whitespace-nowrap">{c.complaint_type}</td>
                        <td className="py-3 px-2 font-mono text-xs">{c.gcc_ticket_ref ?? "—"}</td>
                        <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                          {c.date_reported.split("T")[0]}
                        </td>
                        <td className="py-3 px-2"><StatusBadge status={c.status} /></td>
                        <td className="py-3 px-2">
                          <Button variant="outline" size="sm" className="h-7 gap-1" onClick={() => setViewing(c.complaint_id)}>
                            <Eye className="w-3.5 h-3.5" /> Track
                          </Button>
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

      <SanitationAIChat />
    </DashboardShell>
  )
}
