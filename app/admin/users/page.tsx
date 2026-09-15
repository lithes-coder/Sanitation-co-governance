"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardShell } from "@/components/dashboard-shell"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { UserPlus, Shield, Building2, User, KeyRound, Trash2, RefreshCw } from "lucide-react"

type ManagedUser = {
  email: string
  name: string
  role: string
  created_at?: string
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-primary/15 text-primary",
  officer: "bg-warning/15 text-warning",
  citizen: "bg-muted text-muted-foreground",
}

const ROLE_ICON: Record<string, React.ReactNode> = {
  admin: <Shield className="w-3.5 h-3.5" />,
  officer: <Building2 className="w-3.5 h-3.5" />,
  citizen: <User className="w-3.5 h-3.5" />,
}

function UsersInner() {
  const { currentUser } = useStore()
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<string | null>(null)

  // Create form
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("officer")

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (!res.ok) throw new Error()
      const { users } = await res.json()
      setUsers(users)
    } catch {
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, name: name.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create account")
      toast.success(`${role === "officer" ? "Officer" : "Admin"} account created — share credentials securely`)
      setOpen(false)
      setEmail("")
      setName("")
      setPassword("")
      setRole("officer")
      await refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setCreating(false)
    }
  }

  async function handleResetPassword(u: ManagedUser) {
    const newPassword = prompt(`New password for ${u.email} (min 6 chars):`)
    if (!newPassword) return
    setResetting(u.email)
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Reset failed")
      toast.success(`Password reset for ${u.email}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed")
    } finally {
      setResetting(null)
    }
  }

  async function handleRoleChange(u: ManagedUser, newRole: string) {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.email)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Role change failed")
      toast.success(`${u.email} is now a ${newRole}`)
      await refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Role change failed")
    }
  }

  async function handleDelete(u: ManagedUser) {
    if (!confirm(`Delete account ${u.email}? This cannot be undone.`)) return
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(u.email)}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Delete failed")
      toast.success(`${u.email} deleted`)
      await refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    }
  }

  const staff = users.filter((u) => u.role !== "citizen")
  const citizens = users.filter((u) => u.role === "citizen")

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Corporation staff accounts are provisioned here — citizens sign themselves up on the public register page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={refetch} aria-label="Refresh">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" /> Add Staff Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <DialogHeader>
                  <DialogTitle>Create staff account</DialogTitle>
                  <DialogDescription>
                    For Corporation officers or admins. Citizens cannot be created here — they register publicly.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-2">
                  <Label htmlFor="u-name">Full name</Label>
                  <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Zonal Officer, Zone 9" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-email">Official email</Label>
                  <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="officer9@scgip.gov" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-pass">Temporary password</Label>
                  <Input id="u-pass" type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters" minLength={6} required />
                </div>
                <div className="grid gap-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="officer">Corporation Officer — verify, assign, resolve</SelectItem>
                      <SelectItem value="admin">Administrator — full platform control</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={creating}>{creating ? "Creating…" : "Create account"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Staff accounts */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-primary" /> Corporation Staff ({staff.length})
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {loading ? (
            <p className="text-sm text-muted-foreground p-6 text-center animate-pulse">Loading accounts…</p>
          ) : staff.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No staff accounts yet.</p>
          ) : (
            staff.map((u) => (
              <div key={u.email} className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0">
                <span className="text-primary">{ROLE_ICON[u.role]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Select value={u.role} onValueChange={(r) => handleRoleChange(u, r)} disabled={u.email === currentUser?.email}>
                  <SelectTrigger className="w-28 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="officer">Officer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="citizen">Citizen</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleResetPassword(u)} disabled={resetting === u.email} title="Reset password">
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(u)} title="Delete account">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Citizens (read-only overview) */}
      <section>
        <h2 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" /> Registered Citizens ({citizens.length})
        </h2>
        <div className="rounded-xl border border-border overflow-hidden">
          {citizens.length === 0 ? (
            <p className="text-sm text-muted-foreground p-6 text-center">No citizens registered yet.</p>
          ) : (
            citizens.map((u) => (
              <div key={u.email} className="flex items-center gap-3 px-4 py-3 border-b border-border/60 last:border-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <Badge className={ROLE_BADGE.citizen}>citizen</Badge>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Citizens manage their own accounts — staff can't reset citizen passwords from here (by design).
        </p>
      </section>
    </div>
  )
}

export default function AdminUsersPage() {
  return (
    <DashboardShell requiredRole="admin">
      <UsersInner />
    </DashboardShell>
  )
}
