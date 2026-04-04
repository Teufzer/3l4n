import { prisma } from '@/lib/prisma'
import AdminReportsClient from './AdminReportsClient'

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      reporter: {
        select: { id: true, name: true, email: true },
      },
      post: {
        select: {
          id: true,
          content: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  return <AdminReportsClient initialReports={reports} />
}
