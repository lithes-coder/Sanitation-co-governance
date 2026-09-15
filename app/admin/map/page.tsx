"use client"

import { useStore } from "@/lib/store"
import { DashboardShell } from "@/components/dashboard-shell"
import { WardMap } from "@/components/ward-map"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "lucide-react"

const PRIORITY_STYLES: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-warning text-warning-foreground",
  Medium: "bg-primary/15 text-primary",
  Low: "bg-muted text-muted-foreground",
}

export default function AdminMap() {
  const { complaints } = useStore()

  const withLocation = complaints.filter((c) => c.latitude != null && c.longitude != null)
  const openPins = withLocation.filter((c) => !["Closed", "Rejected"].includes(c.status))

  return (
    <DashboardShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Live Ward Map</h1>
          <p className="text-muted-foreground">
            Complaints with GPS pins, colored by priority — updates live
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#dc2626]" /> Critical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ea580c]" /> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ca8a04]" /> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#2563eb]" /> Low
          </span>
          <Badge variant="outline" className="ml-2">{openPins.length} open pins</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Chennai Coverage
            </CardTitle>
            <CardDescription>
              {withLocation.length} of {complaints.length} complaints have GPS coordinates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WardMap complaints={complaints} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
