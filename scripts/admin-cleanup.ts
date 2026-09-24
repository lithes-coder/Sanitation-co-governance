// One-off admin cleanup: keep ONLY litheshs2007@gmail.com as admin.
// Safe to re-run: upserts the owner as admin, demotes every other admin.
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()
const OWNER = "litheshs2007@gmail.com"
// Override with a real password only at first creation:  set OWNER_PW='...' node script
const OWNER_PW = process.env.OWNER_PW ?? ""

async function main() {
  const users = await db.user.findMany({
    select: { email: true, name: true, role: true, _count: { select: { complaints: true } } },
  })
  console.log("Current users:")
  for (const u of users) console.log(`  ${u.role.padEnd(8)} ${u.email}  (${u._count.complaints} complaints)`)

  // 1. Ensure owner exists and is admin
  const owner = await db.user.findUnique({ where: { email: OWNER } })
  if (!owner) {
    if (!OWNER_PW) {
      console.log(`\nOwner ${OWNER} not found. Re-run with OWNER_PW='a-strong-password' to create the account.`)
    } else {
      await db.user.upsert({
        where: { email: OWNER },
        update: { role: "admin" },
        create: {
          email: OWNER,
          passwordHash: await bcrypt.hash(OWNER_PW, 10),
          name: "Lithesh",
          role: "admin",
        },
      })
      console.log(`Created ${OWNER} as admin.`)
    }
  } else if (owner.role !== "admin") {
    await db.user.update({ where: { email: OWNER }, data: { role: "admin" } })
    console.log(`Promoted ${OWNER} to admin.`)
  } else {
    console.log(`Owner ${OWNER} is already admin.`)
  }

  // 2. Delete the redundant seed admin (public password in repo, owns nothing)
  const seedAdmin = await db.user.findUnique({
    where: { email: "admin@scgip.gov" },
    include: { _count: { select: { complaints: true } } },
  })
  if (seedAdmin && seedAdmin._count.complaints === 0) {
    await db.user.delete({ where: { email: "admin@scgip.gov" } })
    console.log("Deleted seed admin admin@scgip.gov (no complaints attached).")
  }

  // 2b. Delete the seed officer account (public password in repo, owns nothing)
  const seedOfficer = await db.user.findUnique({
    where: { email: "officer@scgip.gov" },
    include: { _count: { select: { complaints: true } } },
  })
  if (seedOfficer && seedOfficer._count.complaints === 0) {
    await db.user.delete({ where: { email: "officer@scgip.gov" } })
    console.log("Deleted seed officer officer@scgip.gov (no complaints attached).")
  }

  // 3. Demote every OTHER admin (never delete users — preserve their data)
  const others = await db.user.findMany({ where: { role: "admin", email: { not: OWNER } } })
  for (const u of others) {
    await db.user.update({ where: { email: u.email }, data: { role: "citizen" } })
    console.log(`Demoted admin → citizen: ${u.email}`)
  }

  const after = await db.user.findMany({ where: { role: "admin" } })
  console.log("\nAdmins now:", after.map((a) => a.email).join(", "))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
