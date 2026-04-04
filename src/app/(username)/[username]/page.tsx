import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

interface Props {
  params: Promise<{ username: string }>
}

export default async function UsernameRedirectPage({ params }: Props) {
  const { username } = await params
  // Strip leading @ if present
  const clean = username.replace(/^@/, '').toLowerCase()

  const user = await prisma.user.findUnique({
    where: { username: clean },
    select: { id: true },
  })

  if (!user) notFound()

  redirect(`/profile/${user.id}`)
}
