import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const db = new PrismaClient()

async function main() {
  console.log("Seeding...")

  // SECURITY: no admin/officer accounts are seeded.
  // The single admin (litheshs2007@gmail.com) is created/managed via
  // `npx tsx scripts/admin-cleanup.ts` with OWNER_PW set — passwords
  // must never live in this public repo.

  // Demo citizen
  await db.user.upsert({
    where: { email: "citizen@example.com" },
    update: { passwordHash: await bcrypt.hash("Citizen@123", 10), role: "citizen" },
    create: {
      email: "citizen@example.com",
      passwordHash: await bcrypt.hash("Citizen@123", 10),
      name: "Demo Citizen",
      role: "citizen",
    },
  })

  // A couple of demo complaints if the DB is empty
  const count = await db.complaint.count()
  if (count === 0) {
    const demo = [
      {
        ward: "Ward 1 - Central",
        complaint_type: "Drain Blockage",
        description: "Storm water drain blocked near the market, stagnant water on the road.",
        priority: "High",
        severity_score: 84,
        severity_reason: 'Type "Drain Blockage" base weight 80/100; photo evidence +10',
        department: "Storm Water Drains Dept",
        status: "Pending",
        latitude: 13.0827,
        longitude: 80.2707,
      },
      {
        ward: "Ward 8 - Industrial",
        complaint_type: "Illegal Dumping",
        description: "Construction debris dumped overnight beside the canal.",
        priority: "Medium",
        severity_score: 65,
        severity_reason: 'Type "Illegal Dumping" base weight 70/100; GPS pin +5',
        department: "Solid Waste Management",
        status: "Pending",
        latitude: 13.0569,
        longitude: 80.2461,
      },
    ]

    for (const d of demo) {
      const now = new Date()
      await db.complaint.create({
        data: {
          ...d,
          severity_reason: d.severity_reason,
          sla_due_at: new Date(now.getTime() + 72 * 3600 * 1000),
          created_by: "citizen@example.com",
          events: {
            create: [
              {
                type: "submitted",
                actor: "citizen@example.com",
                actor_role: "citizen",
                message: "Complaint submitted by Demo Citizen",
                meta: "{}",
              },
            ],
          },
        },
      })
    }
    console.log(`Seeded ${demo.length} demo complaints`)
  }

  console.log("Seed complete:")
  console.log("  citizen  citizen@example.com / Citizen@123")
  console.log("  (admin is NOT seeded — manage via scripts/admin-cleanup.ts)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
