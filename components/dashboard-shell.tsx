"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationBell } from "@/components/notification-bell"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"

const ROLE_HOME: Record<string, string> = {
  admin: "/admin/dashboard",
  officer: "/officer/dashboard",
  citizen: "/citizen/dashboard",
}

export function DashboardShell({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole: string
}) {
  const router = useRouter()
  const { currentUser, loading } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!currentUser) {
      router.replace("/login")
    } else if (currentUser.role !== requiredRole) {
      router.replace(ROLE_HOME[currentUser.role] ?? "/login")
    }
  }, [currentUser, loading, requiredRole, router])

  if (loading || !currentUser || currentUser.role !== requiredRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-pulse text-muted-foreground">Loading…</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <AppSidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-foreground/20"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64">
            <AppSidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar with bell */}
        <div className="flex items-center justify-between gap-3 px-4 lg:px-8 py-3 border-b border-border bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-3 lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            <span className="text-sm font-semibold text-foreground">SCGIP</span>
          </div>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground hidden sm:block mr-2">
              {currentUser.role === "officer" ? "Corporation Officer" : currentUser.role === "admin" ? "Administrator" : "Citizen"} · {currentUser.name}
            </span>
            <NotificationBell />
          </div>
        </div>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
