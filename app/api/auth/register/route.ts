import { db } from "@/lib/server/db"
import { bcrypt, hashPassword, setSessionCookie } from "@/lib/server/auth"
import { toUserDTO } from "@/lib/server/dto"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password || !name) {
      return Response.json({ error: "Name, email and password are required" }, { status: 400 })
    }
    if (String(password).length < 6) {
      return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 })
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
        passwordHash: await hashPassword(password),
        name: String(name).trim(),
        role: "citizen",
      },
    })

    await setSessionCookie(user.email)
    return Response.json({ user: toUserDTO(user) })
  } catch {
    return Response.json({ error: "Registration failed" }, { status: 500 })
  }
}

// bcrypt imported for potential future admin-seeded flows; keep reference alive
void bcrypt
