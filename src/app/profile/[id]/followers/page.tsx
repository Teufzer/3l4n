import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'

export default async function FollowersByIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { username: true } })
  if (!user) notFound()
  if (user.username) redirect(`/${user.username}/followers`)
  redirect(`/feed`)
}
