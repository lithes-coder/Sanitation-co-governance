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
    secure: true,
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
  const nowMs = Date.now()
  let iatMs = NaN
  try { iatMs = Number(JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')).iat) || NaN } catch {}
  if (!Number.isFinite(iatMs) || nowMs - iatMs > 7 * 24 * 3600 * 1000) return null
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

/**
 * Very small in-memory login throttle.
 *
 * Tracks failed attempts per normalized email and enforces a lockout after a
 * threshold, with a progressive cooldown. This is a zero-dependency stopgap
 * that closes the brute-force finding on small deployments. For larger traffic
 * or multi-instance deployments this should be replaced with a shared store
 * (e.g. Upstash Redis / Vercel KV) or a Vercel WAF rate rule on
 * POST /api/auth/login.
 */
const LOGIN_THROTTLE = new Map<string, { fails: number; lockedUntil: number }>()

/** Max failed attempts before a temporary lockout. */
const MAX_FAILS = 5
/** Base lockout duration (ms). Doubles with each consecutive failure window. */
const BASE_LOCKOUT_MS = 60_000
/** Upper bound on lockout (ms). */
const MAX_LOCKOUT_MS = 15 * 3600 * 1000 // 15 minutes

export function loginThrottleAllowed(email: string): { allowed: boolean; retryAfter?: number } {
  const key = email.toLowerCase().trim()
  const now = Date.now()
  const row = LOGIN_THROTTLE.get(key)

  if (!row) {
    return { allowed: true }
  }

  if (row.lockedUntil && now < row.lockedUntil) {
    const retryAfter = Math.ceil((row.lockedUntil - now) / 1000)
    return { allowed: false, retryAfter }
  }

  // Lockout window expired — reset to allow fresh attempts.
  if (row.lockedUntil && now >= row.lockedUntil) {
    LOGIN_THROTTLE.set(key, { fails: 0, lockedUntil: 0 })
    return { allowed: true }
  }

  return { allowed: true }
}

export function loginThrottleRecordFail(email: string) {
  const key = email.toLowerCase().trim()
  const now = Date.now()
  const row = LOGIN_THROTTLE.get(key) ?? { fails: 0, lockedUntil: 0 }

  if (row.lockedUntil && now < row.lockedUntil) {
    // Still locked — do not extend the window further.
    return
  }

  const nextFails = row.fails + 1
  if (nextFails >= MAX_FAILS) {
    const lockoutMs = Math.min(MAX_LOCKOUT_MS, BASE_LOCKOUT_MS * Math.pow(2, Math.min(nextFails - MAX_FAILS + 1, 4)))
    LOGIN_THROTTLE.set(key, { fails: nextFails, lockedUntil: now + lockoutMs })
  } else {
    LOGIN_THROTTLE.set(key, { fails: nextFails, lockedUntil: 0 })
  }
}

export function loginThrottleReset(email: string) {
  const key = email.toLowerCase().trim()
  if (LOGIN_THROTTLE.has(key)) {
    LOGIN_THROTTLE.set(key, { fails: 0, lockedUntil: 0 })
  }
}
