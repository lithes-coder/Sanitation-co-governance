"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useStore, type Complaint } from "@/lib/store"
import { ComplaintTimeline } from "@/components/complaint-timeline"
import { reverseGeocode, getCachedPlace } from "@/lib/reverse-geocode"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatDistanceToNow, format } from "date-fns"
import {
  ArrowLeft,
  MapPin,
  Building2,
  User,
  Clock,
  Star,
  ImageIcon,
  FileText,
} from "lucide-react"

const ROLE_BASE: Record<string, string> = {
  admin: "/admin",
  officer: "/officer",
  citizen: "/citizen",
}

// Where "Back" should go per role — the list page that role actually has.
const BACK_HREF: Record<string, string> = {
  admin: "/admin/dashboard",
  officer: "/officer/dashboard",
  citizen: "/citizen/complaints",
}

const TYPE_LABELS: Record<string, string> = {
  missed_collection: "Missed Collection",
  drain_blockage: "Drain Blockage",
  hazardous_waste: "Hazardous Waste",
  illegal_dumping: "Illegal Dumping",
  public_toilet: "Public Toilet",
  street_sweeping: "Street Sweeping",
  other: "Other",
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3 min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        {icon} {label}
      </p>
      <p className="text-sm text-foreground mt-1 break-words">{value}</p>
    </div>
  )
}

function LocationBlock({ complaint }: { complaint: Complaint }) {
  const [place, setPlace] = useState<string | null>(() =>
    complaint.latitude != null && complaint.longitude != null
      ? getCachedPlace(complaint.latitude, complaint.longitude)
      : null
  )

  useEffect(() => {
    let cancelled = false
    if (complaint.latitude != null && complaint.longitude != null && !place) {
      reverseGeocode(complaint.latitude, complaint.longitude).then((p) => {
        if (!cancelled && p) setPlace(p)
      })
    }
    return () => {
      cancelled = true
    }
  }, [complaint.latitude, complaint.longitude, place])

  if (complaint.latitude == null || complaint.longitude == null) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3 h-3" /> Location
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          ≈ Approximate — ward center of {complaint.ward} (citizen did not share exact GPS)
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-secondary/30 p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
        <MapPin className="w-3 h-3" /> Exact location (GPS)
      </p>
      <p className="text-sm text-foreground mt-1">{place ?? "Resolving address…"}</p>
      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
        {complaint.latitude.toFixed(5)}, {complaint.longitude.toFixed(5)}
      </p>
    </div>
  )
}

export function ComplaintDetail({ id }: { id: string }) {
  const { complaints, currentUser, loading: authLoading } = useStore()
  const [fetched, setFetched] = useState<Complaint | null>(null)
  const [notFound, setNotFound] = useState(false)

  const fromStore = complaints.find((c) => c.complaint_id === id) ?? null
  const complaint = fromStore ?? fetched

  // Direct URL load: the store list may not have loaded yet (or this role's
  // list may legitimately contain it — same scoping as the API).
  useEffect(() => {
    if (fromStore || authLoading || fetched || notFound) return
    let cancelled = false
    fetch(`/api/complaints/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json() as Promise<{ complaint: Complaint }>
      })
      .then(({ complaint }) => {
        if (!cancelled) setFetched(complaint)
      })
      .catch(() => {
        if (!cancelled) setNotFound(true)
      })
    return () => {
      cancelled = true
    }
  }, [id, fromStore, authLoading, fetched, notFound])

  const base = ROLE_BASE[currentUser?.role ?? "citizen"] ?? "/citizen"
  const backHref = BACK_HREF[currentUser?.role ?? "citizen"] ?? "/citizen/complaints"

  if (notFound && !complaint) {
    return (
      <div className="max-w-xl mx-auto text-center py-24">
        <FileText className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="text-lg font-semibold text-foreground mt-4">Complaint not found</h1>
        <p className="text-sm text-muted-foreground mt-1">
          It may belong to another citizen, or the link is stale.
        </p>
        <Button asChild variant="outline" className="mt-6">
          <Link href={backHref}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to complaints
          </Link>
        </Button>
      </div>
    )
  }

  if (!complaint) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-muted-foreground">Loading complaint…</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <h1 className="text-xl font-bold text-foreground">
            {TYPE_LABELS[complaint.complaint_type] ?? complaint.complaint_type}
          </h1>
          <Badge variant="outline" className="font-mono text-xs">{complaint.complaint_id.slice(0, 12)}…</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Reported {formatDistanceToNow(new Date(complaint.date_reported), { addSuffix: true })} ·{" "}
          {format(new Date(complaint.date_reported), "d MMM yyyy, h:mm a")}
        </p>
      </div>

      {complaint.photo && (
        <div className="rounded-xl border border-border overflow-hidden">
          <img src={complaint.photo} alt="Complaint evidence" className="w-full max-h-80 object-cover" />
        </div>
      )}

      <div className="rounded-xl border border-border p-4 flex flex-col gap-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
          <FileText className="w-3 h-3" /> Description
        </p>
        <p className="text-sm text-foreground whitespace-pre-wrap">{complaint.description}</p>
      </div>

      <LocationBlock complaint={complaint} />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Fact icon={<MapPin className="w-3 h-3" />} label="Ward" value={complaint.ward} />
        <Fact
          icon={<Star className="w-3 h-3" />}
          label="Severity"
          value={`${complaint.severity_score}/100 · ${complaint.priority}`}
        />
        {complaint.gcc_ticket_ref && (
          <Fact icon={<Building2 className="w-3 h-3" />} label="GCC Ticket" value={complaint.gcc_ticket_ref} />
        )}
        {complaint.department && (
          <Fact icon={<Building2 className="w-3 h-3" />} label="Department" value={complaint.department} />
        )}
        {complaint.assigned_to && (
          <Fact icon={<User className="w-3 h-3" />} label="Assigned to" value={complaint.assigned_to} />
        )}
        {complaint.sla_due_at && ["Resolved", "Closed"].includes(complaint.status) && (
          <Fact
            icon={<Clock className="w-3 h-3" />}
            label="Resolved on"
            value={complaint.date_resolved ? format(new Date(complaint.date_resolved), "d MMM yyyy, h:mm a") : "—"}
          />
        )}
      </div>

      {complaint.severity_reason && (
        <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
          <span className="font-medium text-foreground">Why this severity: </span>
          {complaint.severity_reason}
        </p>
      )}

      <div>
        <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-muted-foreground" /> Live tracking
        </p>
        <ComplaintTimeline complaint={complaint} />
      </div>
    </div>
  )
}
