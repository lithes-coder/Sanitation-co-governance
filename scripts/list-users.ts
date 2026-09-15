import { PrismaClient } from "@prisma/client"

const db = new PrismaClient()

async function main() {
  const users = await db.user.findMany({ select: { email: true, name: true, role: true } })
  console.log(JSON.stringify(users, null, 1))
  await db.$disconnect()
}

main()
