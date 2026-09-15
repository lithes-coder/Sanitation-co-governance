"use client"

import { useEffect, useState } from "react"
import type { Complaint } from "@/lib/store"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import {
  Check,
  Clock,
  Building2,
  ShieldCheck,
  FlaskConical,
  UserCheck,
  Wrench,
  BadgeCheck,
  XCircle,
  AlertTriangle,
  Star,
} from "lucide-react"

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

const PIPELINE = [
  { key: "Pending", label: "Submitted", icon: FlaskConical },
  { key: "SentToCorporation", label: "At Corporation", icon: Building2 },
  { key: "Verified", label: "Verified", icon: ShieldCheck },
  { key: "Assigned", label: "Assigned", icon: UserCheck },
  { key: "Resolved", label: "Resolved", icon: Wrench },
  { key: "Closed", label: "Closed", icon: BadgeCheck },
]

function pipelineIndex(status: string): number {
  if (status === "Closed") return 5
  if (status === "Resolved") return 4
  if (status === "Assigned") return 3
  if (status === "Verified") return 2
  if (status === "SentToCorporation") return 1
  return 0
}

function SlaCountdown({ due, status }: { due: string | null; status: string }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  if (!due) return null
  if (["Resolved", "Closed", "Rejected"].includes(status)) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-success">
        <Check className="w-3 h-3" /> within SLA window
      </span>
    )
  }
  const ms = new Date(due).getTime() - Date.now()
  const breached = ms <= 0
  const hrs = Math.floor(Math.abs(ms) / 3600000)
  const mins = Math.floor((Math.abs(ms) % 3600000) / 60000)
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${breached ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
    >
      <Clock className="w-3 h-3" />
      {breached ? `SLA breached ${hrs}h ${mins}m ago` : `SLA: ${hrs}h ${mins}m left`}
    </span>
  )
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  submitted: <FlaskConical className="w-3.5 h-3.5" />,
  severity_scored: <Star className="w-3.5 h-3.5" />,
  sent_to_corporation: <Building2 className="w-3.5 h-3.5" />,
  verified: <ShieldCheck className="w-3.5 h-3.5" />,
  rejected: <XCircle className="w-3.5 h-3.5" />,
  needs_info: <AlertTriangle className="w-3.5 h-3.5" />,
  assigned: <UserCheck className="w-3.5 h-3.5" />,
  resolved: <Wrench className="w-3.5 h-3.5" />,
  citizen_confirmed: <BadgeCheck className="w-3.5 h-3.5" />,
  citizen_rejected: <XCircle className="w-3.5 h-3.5" />,
  escalated: <AlertTriangle className="w-3.5 h-3.5" />,
  rated: <Star className="w-3.5 h-3.5" />,
  updated: <Clock className="w-3.5 h-3.5" />,
}

export function ComplaintTimeline({ complaint }: { complaint: Complaint }) {
  const idx = pipelineIndex(complaint.status)
  const isTerminal = complaint.status === "Closed" || complaint.status === "Rejected"
  const activeIdx = isTerminal ? idx : idx

  return (
    <div className="flex flex-col gap-4">
      {/* Header facts */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={STATUS_STYLES[complaint.status] ?? "bg-muted"}>{complaint.status}</Badge>
        <Badge className={PRIORITY_STYLES[complaint.priority] ?? "bg-muted"}>{complaint.priority}</Badge>
        <span className="text-xs text-muted-foreground">
          Severity {complaint.severity_score}/100
        </span>
        {complaint.gcc_ticket_ref && (
          <Badge variant="outline" className="font-mono text-xs">{complaint.gcc_ticket_ref}</Badge>
        )}
        {complaint.department && (
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
            <Building2 className="w-3 h-3" /> {complaint.department}
          </span>
        )}
      </div>

      <SlaCountdown due={complaint.sla_due_at} status={complaint.status} />

      {/* Severity "why" */}
      {complaint.severity_reason && (
        <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
          <span className="font-medium text-foreground">Why this score: </span>
          {complaint.severity_reason}
        </p>
      )}

      {/* Pipeline tracker */}
      <div className="flex items-center">
        {PIPELINE.map((step, i) => {
          const done = i <= activeIdx && !["Rejected", "Escalated"].includes(complaint.status) ? i <= activeIdx : i < activeIdx
          const reachable = !["Rejected", "Escalated"].includes(complaint.status)
          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                    done && reachable
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <step.icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] text-muted-foreground text-center leading-tight w-14">{step.label}</span>
              </div>
              {i < PIPELINE.length - 1 && (
                <div className={`h-0.5 flex-1 mx-0.5 rounded ${done && reachable ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* Event log */}
      <div className="flex flex-col gap-0">
        {[...complaint.events].reverse().map((e, i) => (
          <div key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-7 h-7 rounded-full ${
                  e.type === "escalated" || e.type === "citizen_rejected" || e.type === "rejected"
                    ? "bg-destructive/10 text-destructive"
                    : e.type === "resolved" || e.type === "citizen_confirmed"
                      ? "bg-success/10 text-success"
                      : "bg-primary/10 text-primary"
                }`}
              >
                {EVENT_ICONS[e.type] ?? <Clock className="w-3.5 h-3.5" />}
              </div>
              {i < complaint.events.length - 1 && <div className="w-px flex-1 bg-border my-1" />}
            </div>
            <div className="pb-4 min-w-0">
              <p className="text-sm text-foreground">{e.message}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {e.actor_role !== "system" ? e.actor : "System"} ·{" "}
                {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Resolution evidence */}
      {(complaint.resolution_note || complaint.after_photo) && (
        <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-foreground">Resolution evidence</p>
          {complaint.resolution_note && (
            <p className="text-xs text-muted-foreground">{complaint.resolution_note}</p>
          )}
          {complaint.after_photo && (
            <img src={complaint.after_photo} alt="After resolution" className="w-full max-w-xs rounded-lg border border-border" />
          )}
        </div>
      )}
    </div>
  )
}
