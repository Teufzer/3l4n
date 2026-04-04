import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { notFound } from 'next/navigation'
import ProfileContent from '@/components/profile/ProfileContent'

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth()
  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      weightEntries: { orderBy: { date: 'asc' } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { reactions: true },
      },
      _count: { select: { posts: true, weightEntries: true, followers: true, following: true } },
    },
  })

  if (!user) notFound()

  return <ProfileContent user={user} session={session} />
}
