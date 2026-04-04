import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  if (req.headers.get('x-admin-secret') !== 'import-secret-3l4n-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { userId, startWeight, entries } = await req.json()

  // Set startWeight
  if (startWeight) {
    await prisma.user.update({ where: { id: userId }, data: { startWeight } })
  }

  // Delete existing entries
  await prisma.weightEntry.deleteMany({ where: { userId } })

  // Insert all
  const data = entries.map((e: { weight: number; date: string }) => ({
    userId,
    weight: e.weight,
    date: new Date(e.date),
    note: null,
  }))

  const result = await prisma.weightEntry.createMany({ data })
  return NextResponse.json({ inserted: result.count })
}
