"use client"

/**
 * Client store: cookie-session auth + REST + SSE live updates.
 * Keeps the same useStore() interface the pages already use.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { toast } from "sonner"

export type SessionUser = {
  email: string
  name: string
  role: string
}

export type ComplaintEvent = {
  id: string
  type: string
  actor: string
  actor_role: string
  message: string
  meta: Record<string, unknown>
  created_at: string
}

export type Complaint = {
  complaint_id: string
  ward: string
  complaint_type: string
  description: string
  photo: string | null
  latitude: number | null
  longitude: number | null

  status: string
  priority: string
  severity_score: number
  severity_reason: string
  sla_due_at: string | null
  department: string | null
  gcc_ticket_ref: string | null
  verification_status: string
  verification_note: string | null
  assigned_to: string | null
  resolution_note: string | null
  after_photo: string | null

  citizen_satisfaction: number | null
  community_verification_score: number | null
  reopened_count: number
  trust_points: number

  date_reported: string
  date_resolved: string | null
  date_closed: string | null
  escalated_at: string | null
  acked_at: string | null
  updated_at: string

  created_by: string
  events: ComplaintEvent[]
}

export type AppNotification = {
  id: string
  type: string
  title: string
  body: string
  complaint_id: string | null
  read: boolean
  created_at: string
}

interface StoreContextType {
  // Auth
  currentUser: SessionUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string; error?: string }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void

  // Complaints
  complaints: Complaint[]
  addComplaint: (data: {
    ward: string
    type: string
    description: string
    photo: string | null
    latitude: number | null
    longitude: number | null
  }) => Promise<boolean>
  updateStatus: (id: string, status: string) => Promise<void>
  rateSatisfaction: (id: string, rating: number) => Promise<void>
  verifyComplaint: (id: string, score: number) => Promise<void>

  // Officer actions
  verifyByOfficer: (id: string, decision: "Genuine" | "NeedsInfo" | "Spam", note?: string) => Promise<boolean>
  assignComplaint: (id: string, department: string) => Promise<boolean>
  resolveComplaint: (id: string, note: string, afterPhoto: string | null) => Promise<boolean>

  // Citizen confirm/reject
  confirmResolution: (id: string, accept: boolean, note?: string) => Promise<boolean>

  // Legacy import
  importLegacy: () => Promise<number>

  // Notifications
  notifications: AppNotification[]
  unreadNotifs: number
  markAllRead: () => Promise<void>
  markNotifRead: (id: string) => Promise<void>

  // Legacy-compat
  unreadCount: number
  markAsViewed: () => void
  lastUpdated: Date

  users: SessionUser[]
}

const StoreContext = createContext<StoreContextType | null>(null)

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`)
  return data as T
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const seenNotifIds = useRef<Set<string>>(new Set())
  const firstNotifLoad = useRef(true)

  // ── Session bootstrap ─────────────────────────────────────────
  useEffect(() => {
    api<{ user: SessionUser | null }>("/api/auth/me")
      .then(({ user }) => setCurrentUser(user))
      .catch(() => setCurrentUser(null))
      .finally(() => setLoading(false))
  }, [])

  // ── Data fetchers ─────────────────────────────────────────────
  const refetchComplaints = useCallback(async () => {
    try {
      const { complaints } = await api<{ complaints: Complaint[] }>("/api/complaints")
      setComplaints(complaints)
      setLastUpdated(new Date())
    } catch {
      // not signed in or network hiccup
    }
  }, [])

  const refetchNotifications = useCallback(async () => {
    try {
      const { notifications } = await api<{ notifications: AppNotification[] }>("/api/notifications")
      setNotifications(notifications)

      // Toast for notifications we haven't seen yet (skip the initial load).
      const fresh = notifications.filter((n) => !n.read && !seenNotifIds.current.has(n.id))
      notifications.forEach((n) => seenNotifIds.current.add(n.id))
      if (!firstNotifLoad.current) {
        for (const n of fresh.slice(0, 3)) {
          toast(n.title, { description: n.body })
        }
      }
      firstNotifLoad.current = false
    } catch {
      // ignore
    }
  }, [])

  // Initial load after auth resolves
  useEffect(() => {
    if (!currentUser) return
    refetchComplaints()
    refetchNotifications()
  }, [currentUser, refetchComplaints, refetchNotifications])

  // ── SSE live updates ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    const es = new EventSource("/api/events/stream")
    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as { topic: string }
        if (msg.topic === "complaints") refetchComplaints()
        if (msg.topic === "notifications") refetchNotifications()
      } catch {
        // ignore malformed frames
      }
    }
    return () => es.close()
  }, [currentUser, refetchComplaints, refetchNotifications])

  // ── Auth actions ──────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })
      setCurrentUser(user)
      return { success: true, role: user.role }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Login failed" }
    }
  }, [])

  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      const { user } = await api<{ user: SessionUser }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name }),
      })
      setCurrentUser(user)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Registration failed" }
    }
  }, [])

  const logout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setCurrentUser(null)
    setComplaints([])
    setNotifications([])
    firstNotifLoad.current = true
  }, [])

  // ── Complaint actions ─────────────────────────────────────────
  const addComplaint = useCallback(
    async (data: {
      ward: string
      type: string
      description: string
      photo: string | null
      latitude: number | null
      longitude: number | null
    }) => {
      try {
        await api("/api/complaints", {
          method: "POST",
          body: JSON.stringify({
            ward: data.ward,
            type: data.type,
            description: data.description,
            photo: data.photo,
            latitude: data.latitude,
            longitude: data.longitude,
          }),
        })
        await refetchComplaints()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Submit failed")
        return false
      }
    },
    [refetchComplaints]
  )

  const updateStatus = useCallback(
    async (id: string, status: string) => {
      try {
        await api(`/api/complaints/${id}/status`, { method: "POST", body: JSON.stringify({ status }) })
        await refetchComplaints()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Update failed")
      }
    },
    [refetchComplaints]
  )

  const rateSatisfaction = useCallback(
    async (id: string, rating: number) => {
      try {
        await api(`/api/complaints/${id}/rate`, { method: "POST", body: JSON.stringify({ rating }) })
        await refetchComplaints()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Rating failed")
      }
    },
    [refetchComplaints]
  )

  const verifyComplaint = useCallback(
    async (id: string, score: number) => {
      // Community verification — low scores reopen the complaint.
      const accept = score >= 2.5
      try {
        await api(`/api/complaints/${id}/confirm`, {
          method: "POST",
          body: JSON.stringify({ accept, note: `Community quality score: ${score}/5` }),
        })
        await refetchComplaints()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Verification failed")
      }
    },
    [refetchComplaints]
  )

  // ── Officer actions ───────────────────────────────────────────
  const verifyByOfficer = useCallback(
    async (id: string, decision: "Genuine" | "NeedsInfo" | "Spam", note?: string) => {
      try {
        await api(`/api/complaints/${id}/verify`, {
          method: "POST",
          body: JSON.stringify({ decision, note }),
        })
        await refetchComplaints()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Verify failed")
        return false
      }
    },
    [refetchComplaints]
  )

  const assignComplaint = useCallback(
    async (id: string, department: string) => {
      try {
        await api(`/api/complaints/${id}/assign`, {
          method: "POST",
          body: JSON.stringify({ department }),
        })
        await refetchComplaints()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Assign failed")
        return false
      }
    },
    [refetchComplaints]
  )

  const resolveComplaint = useCallback(
    async (id: string, note: string, afterPhoto: string | null) => {
      try {
        await api(`/api/complaints/${id}/resolve`, {
          method: "POST",
          body: JSON.stringify({ note, after_photo: afterPhoto }),
        })
        await refetchComplaints()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Resolve failed")
        return false
      }
    },
    [refetchComplaints]
  )

  // ── Citizen confirm/reject ────────────────────────────────────
  const confirmResolution = useCallback(
    async (id: string, accept: boolean, note?: string) => {
      try {
        await api(`/api/complaints/${id}/confirm`, {
          method: "POST",
          body: JSON.stringify({ accept, note }),
        })
        await refetchComplaints()
        return true
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Action failed")
        return false
      }
    },
    [refetchComplaints]
  )

  // ── Legacy import ─────────────────────────────────────────────
  const importLegacy = useCallback(async () => {
    let raw: unknown[] = []
    try {
      raw = JSON.parse(localStorage.getItem("scgip_complaints") || "[]")
    } catch {
      raw = []
    }
    if (!Array.isArray(raw) || raw.length === 0) return 0
    const res = await api<{ imported: number; skipped: number }>("/api/import-localstorage", {
      method: "POST",
      body: JSON.stringify({ complaints: raw }),
    })
    await refetchComplaints()
    return res.imported
  }, [refetchComplaints])

  // ── Notification actions ──────────────────────────────────────
  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    await api("/api/notifications", { method: "POST", body: JSON.stringify({ action: "mark_all_read" }) }).catch(() => {})
  }, [])

  const markNotifRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    await api("/api/notifications", { method: "POST", body: JSON.stringify({ action: "mark_read", id }) }).catch(() => {})
  }, [])

  const unreadNotifs = notifications.filter((n) => !n.read).length
  const unreadCount = unreadNotifs
  const markAsViewed = () => {}

  const users: SessionUser[] = currentUser ? [currentUser] : []

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        loading,
        login,
        register,
        logout,
        complaints,
        addComplaint,
        updateStatus,
        rateSatisfaction,
        verifyComplaint,
        verifyByOfficer,
        assignComplaint,
        resolveComplaint,
        confirmResolution,
        importLegacy,
        notifications,
        unreadNotifs,
        markAllRead,
        markNotifRead,
        unreadCount,
        markAsViewed,
        lastUpdated,
        users,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
