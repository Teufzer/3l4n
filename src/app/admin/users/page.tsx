import { prisma } from '@/lib/prisma'
import AdminUsersClient from './AdminUsersClient'

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      image: true,
      role: true,
      banned: true,
      verified: true,
      createdAt: true,
      _count: {
        select: { posts: true, comments: true },
      },
    },
  })

  return <AdminUsersClient initialUsers={users} />
}
