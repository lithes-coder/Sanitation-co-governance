import { db } from "@/lib/server/db"
import { requireRole, hashPassword } from "@/lib/server/auth"
import { toUserDTO } from "@/lib/server/dto"

// List all users (staff + citizens) — admin only.
export async function GET() {
  const admin = await requireRole(["admin"])
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const users = await db.user.findMany({ orderBy: { email: "asc" } })
  return Response.json({ users: users.map(toUserDTO) })
}

// Create a staff account (officer or admin) — admin only.
// Citizens self-register on /register; this endpoint rejects citizen creation
// to keep the public sign-up flow the only path to citizen accounts.
export async function POST(request: Request) {
  const admin = await requireRole(["admin"])
  if (!admin) return Response.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { email, password, name, role } = await request.json()
    if (!email || !password || !name || !role) {
      return Response.json({ error: "Name, email, password and role are required" }, { status: 400 })
    }
    if (String(password).length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }
    if (!["officer", "admin"].includes(role)) {
      return Response.json({ error: "Role must be officer or admin — citizens use public sign-up" }, { status: 400 })
    }

    const normalized = String(email).trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return Response.json({ error: "Please enter a valid email address" }, { status: 400 })
    }
    const existing = await db.user.findUnique({ where: { email: normalized } })
    if (existing) {
      return Response.json({ error: "Email already registered" }, { status: 409 })
    }

    const user = await db.user.create({
      data: {
        email: normalized,
        passwordHash: await hashPassword(String(password)),
        name: String(name).trim(),
        role,
      },
    })

    return Response.json({ user: toUserDTO(user) }, { status: 201 })
  } catch {
    return Response.json({ error: "Failed to create user" }, { status: 500 })
  }
}
