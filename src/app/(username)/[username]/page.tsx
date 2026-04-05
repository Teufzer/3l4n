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
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      avatar: true,
      bannerUrl: true,
      bio: true,
      createdAt: true,
      startWeight: true,
      targetWeight: true,
      height: true,
      weightPrivate: true,
      profilePrivate: true,
      heightPrivate: true,
      imcPrivate: true,
      verified: true,
      weightEntries: { orderBy: { date: 'asc' }, select: { id: true, weight: true, date: true, note: true } },
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, content: true, createdAt: true, imageUrl: true, reactions: { select: { type: true } } },
      },
      _count: { select: { posts: true, weightEntries: true, followers: true, following: true } },
    },
  })

  if (!user) notFound()

  return <ProfileContent user={user} session={session} />
}
