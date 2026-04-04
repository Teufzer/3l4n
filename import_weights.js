const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('@prisma/client')

const weights = [
  { weight: 192.00, date: "2026-01-17" },
  { weight: 191.30, date: "2026-01-18" },
  { weight: 190.00, date: "2026-01-19" },
  { weight: 188.70, date: "2026-01-20" },
  { weight: 188.30, date: "2026-01-21" },
  { weight: 187.60, date: "2026-01-22" },
  { weight: 186.80, date: "2026-01-23" },
  { weight: 186.70, date: "2026-01-24" },
  { weight: 186.10, date: "2026-01-25" },
  { weight: 185.80, date: "2026-01-26" },
  { weight: 185.60, date: "2026-01-27" },
  { weight: 185.50, date: "2026-01-28" },
  { weight: 184.90, date: "2026-01-29" },
  { weight: 184.90, date: "2026-01-30" },
  { weight: 184.60, date: "2026-01-31" },
  { weight: 184.20, date: "2026-02-01" },
  { weight: 183.70, date: "2026-02-02" },
  { weight: 184.10, date: "2026-02-03" },
  { weight: 183.20, date: "2026-02-04" },
  { weight: 182.60, date: "2026-02-05" },
  { weight: 182.90, date: "2026-02-06" },
  { weight: 183.40, date: "2026-02-07" },
  { weight: 181.90, date: "2026-02-08" },
  { weight: 180.60, date: "2026-02-09" },
  { weight: 180.30, date: "2026-02-10" },
  { weight: 180.10, date: "2026-02-11" },
  { weight: 180.10, date: "2026-02-12" },
  { weight: 180.10, date: "2026-02-13" },
  { weight: 180.60, date: "2026-02-14" },
  { weight: 181.20, date: "2026-02-15" },
  { weight: 179.70, date: "2026-02-18" },
  { weight: 179.00, date: "2026-02-21" },
  { weight: 176.70, date: "2026-02-22" },
  { weight: 178.90, date: "2026-03-01" },
  { weight: 178.20, date: "2026-03-04" },
  { weight: 177.20, date: "2026-03-08" },
  { weight: 176.60, date: "2026-03-11" },
  { weight: 175.80, date: "2026-03-17" },
  { weight: 174.80, date: "2026-03-18" },
  { weight: 173.80, date: "2026-03-22" },
  { weight: 172.90, date: "2026-03-26" },
  { weight: 172.60, date: "2026-03-28" },
  { weight: 172.20, date: "2026-03-29" },
  { weight: 171.30, date: "2026-04-03" },
]

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
  const prisma = new PrismaClient({ adapter })

  // Find TeufeurS user
  const user = await prisma.user.findFirst({
    where: { OR: [{ name: { contains: 'Teuf', mode: 'insensitive' } }, { email: { contains: 'teuf', mode: 'insensitive' } }] }
  })

  if (!user) {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } })
    console.log('Users found:', JSON.stringify(users))
    process.exit(1)
  }

  console.log('Found user:', user.name, user.email, user.id)

  // Delete existing entries
  await prisma.weightEntry.deleteMany({ where: { userId: user.id } })

  // Insert all entries
  const data = weights.map(w => ({
    userId: user.id,
    weight: w.weight,
    date: new Date(w.date),
    note: null,
  }))

  const result = await prisma.weightEntry.createMany({ data })
  console.log('Inserted:', result.count, 'entries')

  // Update startWeight
  await prisma.user.update({
    where: { id: user.id },
    data: { startWeight: 192.0 }
  })

  console.log('Done!')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
