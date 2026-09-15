"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDistanceToNow } from "date-fns"
import {
  Bell,
  FileText,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Info,
} from "lucide-react"

const TYPE_ICONS: Record<string, React.ReactNode> = {
  complaint_submitted: <FileText className="w-4 h-4 text-primary" />,
  verified: <ShieldCheck className="w-4 h-4 text-success" />,
  assigned: <Building2 className="w-4 h-4 text-primary" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-success" />,
  citizen_confirmed: <ThumbsUp className="w-4 h-4 text-success" />,
  citizen_rejected: <ThumbsDown className="w-4 h-4 text-destructive" />,
  escalated: <AlertTriangle className="w-4 h-4 text-destructive" />,
  info: <Info className="w-4 h-4 text-primary" />,
}

export function NotificationBell() {
  const { notifications, unreadNotifs, markAllRead, markNotifRead, currentUser } = useStore()
  const router = useRouter()

  const complaintHref = (complaintId: string) => {
    const base =
      currentUser?.role === "admin" ? "/admin" : currentUser?.role === "officer" ? "/officer" : "/citizen"
    return `${base}/complaints/${complaintId}`
  }
  const [, setTick] = useState(0)

  // Re-render every 30s so "2m ago" labels stay fresh.
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="w-5 h-5" />
          {unreadNotifs > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold animate-pulse">
              {unreadNotifs > 9 ? "9+" : unreadNotifs}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-semibold text-foreground">
            Notifications {unreadNotifs > 0 && <span className="text-destructive">({unreadNotifs})</span>}
          </span>
          {unreadNotifs > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead()}>
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-10">
              No notifications yet — updates on complaints will appear here.
            </p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markNotifRead(n.id)
                  if (n.complaint_id) {
                    // Close the popover by blurring focus, then navigate.
                    ;(document.activeElement as HTMLElement | null)?.blur()
                    router.push(complaintHref(n.complaint_id))
                  }
                }}
                className={`w-full text-left flex gap-3 px-4 py-3 border-b border-border/60 last:border-0 transition-colors hover:bg-secondary/60 ${
                  n.read ? "opacity-65" : "bg-primary/5"
                }`}
              >
                <span className="mt-0.5 shrink-0">{TYPE_ICONS[n.type] ?? <Info className="w-4 h-4 text-muted-foreground" />}</span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground truncate">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-destructive shrink-0" aria-label="unread" />}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</span>
                  <span className="block text-[11px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    {n.complaint_id && (
                      <Link
                        href={complaintHref(n.complaint_id)}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!n.read) markNotifRead(n.id)
                        }}
                        title="View complaint details"
                        className="ml-2 text-primary hover:underline font-mono"
                      >
                        {n.complaint_id.slice(0, 12)}…
                      </Link>
                    )}
                  </span>
                </span>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
