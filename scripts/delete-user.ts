import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const target = process.argv[2]
  if (!target) {
    console.error("Usage: npx tsx scripts/delete-user.ts <email>")
    process.exit(1)
  }
  const existing = await db.user.findUnique({ where: { email: target } })
  if (!existing) {
    console.log(`No user with email ${target}`)
  } else {
    await db.user.delete({ where: { email: target } })
    console.log(`Deleted user ${target} (${existing.role})`)
  }
  await db.$disconnect()
}

main()
