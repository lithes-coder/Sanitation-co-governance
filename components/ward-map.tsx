"use client"

import dynamic from "next/dynamic"
import type { RichMapComplaint } from "./ward-map-inner"

export type MapComplaint = {
  complaint_id: string
  ward: string
  complaint_type: string
  status: string
  priority: string
  latitude: number | null
  longitude: number | null
}

export type { RichMapComplaint }

const WardMapInner = dynamic(() => import("./ward-map-inner").then((m) => m.WardMapInner), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 rounded-lg border border-border bg-secondary/40 text-sm text-muted-foreground">
      Loading map…
    </div>
  ),
})

export function WardMap({ complaints }: { complaints: RichMapComplaint[] }) {
  return <WardMapInner complaints={complaints} />
}
