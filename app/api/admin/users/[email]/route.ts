import { db } from "@/lib/server/db"
import { requireRole, hashPassword } from "@/lib/server/auth"
import { toUserDTO } from "@/lib/server/dto"

// Update a user's role or reset their password — admin only.
export async function PATCH(request: Request, ctx: { params: Promise<{ email: string }> }) {
  const admin = await requireRole(["admin"])
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { email } = await ctx.params
  const normalized = decodeURIComponent(email).trim().toLowerCase()

  // Guard: the seeded root admin can't demote or delete themselves out of the system.
  if (normalized === admin.email) {
    return Response.json({ error: "You cannot modify your own account" }, { status: 400 })
  }

  try {
    const { role, password } = await request.json()
    const data: { role?: string; passwordHash?: string } = {}

    if (role !== undefined) {
      if (!["officer", "admin", "citizen"].includes(role)) {
        return Response.json({ error: "Invalid role" }, { status: 400 })
      }
      data.role = role
    }
    if (password !== undefined) {
      if (String(password).length < 6) {
        return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 })
      }
      data.passwordHash = await hashPassword(String(password))
    }
    if (Object.keys(data).length === 0) {
      return Response.json({ error: "Nothing to update" }, { status: 400 })
    }

    const user = await db.user.update({ where: { email: normalized }, data })
    return Response.json({ user: toUserDTO(user) })
  } catch {
    return Response.json({ error: "User not found or update failed" }, { status: 404 })
  }
}

// Remove a user account — admin only.
export async function DELETE(_req: Request, ctx: { params: Promise<{ email: string }> }) {
  const admin = await requireRole(["admin"])
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { email } = await ctx.params
  const normalized = decodeURIComponent(email).trim().toLowerCase()

  if (normalized === admin.email) {
    return Response.json({ error: "You cannot delete your own account" }, { status: 400 })
  }

  try {
    await db.user.delete({ where: { email: normalized } })
    return Response.json({ ok: true })
  } catch {
    return Response.json({ error: "User not found" }, { status: 404 })
  }
}
