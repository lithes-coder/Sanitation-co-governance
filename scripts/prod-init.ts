/**
 * Production bootstrap — runs once per deploy via `npm run start:prod`.
 *
 * Creates the single owner admin from Railway env vars:
 *   ADMIN_EMAIL      → the one admin account (e.g. litheshs2007@gmail.com)
 *   ADMIN_PASSWORD   → its password (set ONLY in Railway's variables, never in code)
 *
 * If the vars are absent, the app still boots — an admin can be created later
 * by redeploying with the vars set, or via scripts/admin-cleanup.ts.
 *
 * SECURITY: no passwords are ever hardcoded here or logged.
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (email && password) {
    if (password.length < 8) {
      console.warn("[prod-init] ADMIN_PASSWORD too short (<8 chars) — admin NOT created/updated.")
    } else {
      await db.user.upsert({
        where: { email },
        update: { role: "admin", passwordHash: await bcrypt.hash(password, 10) },
        create: {
          email,
          passwordHash: await bcrypt.hash(password, 10),
          name: process.env.ADMIN_NAME?.trim() || "Administrator",
          role: "admin",
        },
      })
      console.log(`[prod-init] admin ready: ${email} (sole admin — any other admin is demoted)`)
    }
  } else {
    console.log("[prod-init] ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin bootstrap.")
  }

  // Demote any other admins that might exist (defense in depth).
  const admins = await db.user.findMany({ where: { role: "admin" } })
  for (const a of admins) {
    if (email && a.email !== email) {
      await db.user.update({ where: { email: a.email }, data: { role: "citizen" } })
      console.log(`[prod-init] demoted extra admin: ${a.email}`)
    }
  }

  // Heads-up if the publicly-known demo citizen is present (password is in the repo).
  const demo = await db.user.findUnique({ where: { email: "citizen@example.com" } })
  if (demo) {
    console.warn("[prod-init] NOTE: demo citizen (citizen@example.com) exists — its password is public in the repo. Fine for demos; delete on a serious deployment.")
  }
}

main()
  .catch((e) => {
    console.error("[prod-init] failed:", e)
    // Do not crash the deploy — the app may still be startable for debugging.
  })
  .finally(() => db.$disconnect())
