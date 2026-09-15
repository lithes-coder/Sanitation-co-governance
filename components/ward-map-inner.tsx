"use client"

import { Fragment, useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import type { MapComplaint } from "./ward-map"
import { reverseGeocode, getCachedPlace } from "@/lib/reverse-geocode"

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "#ef4444",
  High: "#f97316",
  Medium: "#eab308",
  Low: "#3b82f6",
}

export type RichMapComplaint = MapComplaint & {
  description?: string
  photo?: string | null
  gcc_ticket_ref?: string | null
  department?: string | null
  severity_score?: number
  date_reported: string
  created_by?: string
}

const WARD_CENTERS: Record<string, [number, number]> = {
  "Ward 1 - Central": [13.0827, 80.2707],
  "Ward 2 - Northside": [13.1489, 80.2417],
  "Ward 3 - Eastgate": [13.093, 80.295],
  "Ward 4 - Southpark": [13.021, 80.23],
  "Ward 5 - Westfield": [13.052, 80.195],
  "Ward 6 - Hilltop": [13.118, 80.21],
  "Ward 7 - Riverside": [13.075, 80.315],
  "Ward 8 - Industrial": [13.013, 80.301],
}

function isFresh(dateIso: string): boolean {
  return Date.now() - new Date(dateIso).getTime() < 10 * 60 * 1000
}

function fmtAge(dateIso: string): string {
  const mins = Math.floor((Date.now() - new Date(dateIso).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function MapFlyout({ complaints }: { complaints: RichMapComplaint[] }) {
  const map = useMap()
  useEffect(() => {
    const pins = complaints.filter((c) => c.latitude != null && c.longitude != null)
    if (pins.length > 0) {
      map.fitBounds(
        L.latLngBounds(pins.map((c) => [c.latitude!, c.longitude!] as [number, number])),
        { padding: [40, 40], maxZoom: 14 }
      )
    }
  }, [complaints.length, map]) // refit only when the pin count changes
  return null
}

export function WardMapInner({ complaints }: { complaints: RichMapComplaint[] }) {
  const [, force] = useState(0)

  // Resolve place names for GPS pins (queued, cached, rate-limit-safe).
  useEffect(() => {
    let alive = true
    const jobs = complaints
      .filter((c) => c.latitude != null && c.longitude != null)
      .map((c) => reverseGeocode(c.latitude!, c.longitude!).then(() => alive && force((x) => x + 1)))
    Promise.all(jobs).catch(() => {})
    return () => {
      alive = false
    }
  }, [complaints])

  const withGPS = useMemo(
    () => complaints.filter((c) => c.latitude != null && c.longitude != null),
    [complaints]
  )
  const wardOnly = useMemo(
    () => complaints.filter((c) => (c.latitude == null || c.longitude == null) && WARD_CENTERS[c.ward]),
    [complaints]
  )

  function popupHtml(c: RichMapComplaint, approx: boolean): string {
    const color = PRIORITY_COLORS[c.priority] ?? "#3b82f6"
    const place = c.latitude != null && c.longitude != null ? getCachedPlace(c.latitude, c.longitude) : null
    const loc = place
      ? `${place}${approx ? ` · ≈${c.ward} center` : ""}`
      : approx
        ? `≈ ${c.ward} (approximate — no GPS pin)`
        : `${c.latitude!.toFixed(5)}, ${c.longitude!.toFixed(5)}`
    const photo = c.photo
      ? `<img src="${c.photo}" alt="complaint" style="width:100%;height:110px;object-fit:cover;border-radius:8px;margin-bottom:8px;border:1px solid rgba(255,255,255,.1)" />`
      : ""
    const desc = c.description || ""
    return `
      <div style="min-width:230px;max-width:270px">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span style="display:inline-block;width:9px;height:9px;border-radius:99px;background:${color}"></span>
          <strong style="font-size:13px">${c.complaint_type}</strong>
          <span style="margin-left:auto;font-size:10px;color:#8b93a3">${c.priority}</span>
        </div>
        ${photo}
        <div style="font-size:12px;line-height:1.45;margin-bottom:8px">${desc.slice(0, 140)}${desc.length > 140 ? "…" : ""}</div>
        <div style="font-size:11px;color:#aab2c0;display:flex;flex-direction:column;gap:3px">
          <span>📍 ${loc}</span>
          <span>🏘️ ${c.ward}</span>
          ${c.gcc_ticket_ref ? `<span>🎫 Ticket <b>${c.gcc_ticket_ref}</b></span>` : "<span>🎫 Awaiting Corporation ack…</span>"}
          ${c.department ? `<span>🏢 ${c.department}</span>` : ""}
          <span>🕒 ${fmtAge(c.date_reported)} · ${c.status}</span>
        </div>
      </div>`
  }

  return (
    <div className="rounded-lg overflow-hidden border border-border relative map-pin-pause">
      <MapContainer center={[13.0827, 80.2707]} zoom={11} style={{ height: 460, width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapFlyout complaints={complaints} />

        {withGPS.map((c) => {
          const color = PRIORITY_COLORS[c.priority] ?? "#3b82f6"
          const fresh = isFresh(c.date_reported)
          return (
            <Fragment key={c.complaint_id}>
              {fresh && (
                <CircleMarker
                  center={[c.latitude!, c.longitude!]}
                  radius={16}
                  interactive={false}
                  pathOptions={{ color, fillColor: color, fillOpacity: 0.18, weight: 0 }}
                  className="map-pin-pulse"
                />
              )}
              <CircleMarker
                center={[c.latitude!, c.longitude!]}
                radius={c.priority === "Critical" ? 9 : c.priority === "High" ? 7 : 6}
                pathOptions={{ color: "#0d1117", weight: 2, fillColor: color, fillOpacity: 0.95 }}
              >
                <Popup>
                  <div dangerouslySetInnerHTML={{ __html: popupHtml(c, false) }} />
                </Popup>
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  {c.complaint_type} · {c.priority}
                </Tooltip>
              </CircleMarker>
            </Fragment>
          )
        })}

        {wardOnly.map((c) => {
          const center = WARD_CENTERS[c.ward]
          const color = PRIORITY_COLORS[c.priority] ?? "#3b82f6"
          return (
            <CircleMarker
              key={c.complaint_id}
              center={center}
              radius={7}
              pathOptions={{ color, weight: 1.5, fillColor: color, fillOpacity: 0.45, dashArray: "3 3" }}
            >
              <Popup>
                <div dangerouslySetInnerHTML={{ __html: popupHtml(c, true) }} />
              </Popup>
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                ≈ {c.complaint_type} · {c.ward}
              </Tooltip>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-lg border border-border bg-card/90 backdrop-blur px-3 py-1.5 text-xs text-muted-foreground shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        Live · {withGPS.length} GPS pins + {wardOnly.length} ward approximations
      </div>
    </div>
  )
}
