import { NextRequest } from "next/server"
import { db } from "@/lib/server/db"
import { bcrypt, setSessionCookie } from "@/lib/server/auth"
import { toUserDTO } from "@/lib/server/dto"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 })
    }
    const user = await db.user.findUnique({ where: { email: String(email).trim().toLowerCase() } })
    if (!user) return Response.json({ error: "Invalid email or password" }, { status: 401 })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return Response.json({ error: "Invalid email or password" }, { status: 401 })

    await setSessionCookie(user.email)
    return Response.json({ user: toUserDTO(user) })
  } catch {
    return Response.json({ error: "Login failed" }, { status: 500 })
  }
}
