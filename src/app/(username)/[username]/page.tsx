import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { auth } from '@/auth'
import ProfileContent from '@/components/profile/ProfileContent'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UsernamePage({ params }: Props) {
  const { username } = await params
  const clean = username.replace(/^@/, '').toLowerCase()

  const session = await auth()

  const user = await prisma.user.findUnique({
    where: { username: clean },
    include: {
      weightEntries: { orderBy: { date: 'asc' } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { reactions: true },
      },
      _count: { select: { posts: true, weightEntries: true } },
    },
  })

  if (!user) notFound()

  return <ProfileContent user={user} session={session} />
}
