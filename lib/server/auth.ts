import { cookies } from "next/headers"
import { createHmac } from "crypto"
import bcrypt from "bcryptjs"
import { db } from "./db"

const COOKIE_NAME = "scgip_session"
const secret = process.env.AUTH_SECRET || "scgip-dev-secret"

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10)
}

export { bcrypt }

function sign(payload: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url")
}

export function createSessionToken(email: string) {
  const payload = Buffer.from(JSON.stringify({ email, iat: Date.now() })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export async function setSessionCookie(email: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, createSessionToken(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
}

export async function clearSessionCookie() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

export type SessionUser = {
  email: string
  name: string
  role: string
}

/** Read + verify the session cookie, returning the DB user. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies()
  const v = jar.get(COOKIE_NAME)?.value
  if (!v) return null
  const [payload, sig] = v.split(".")
  if (!payload || !sig) return null
  if (sign(payload) !== sig) return null
  try {
    const { email } = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    const user = await db.user.findUnique({ where: { email } })
    if (!user) return null
    return { email: user.email, name: user.name, role: user.role }
  } catch {
    return null
  }
}

export async function requireRole(roles: string[]) {
  const user = await getCurrentUser()
  if (!user || !roles.includes(user.role)) return null
  return user
}
