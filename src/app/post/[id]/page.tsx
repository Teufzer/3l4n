import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import SharedPostView from './SharedPostView'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, username: true } },
    },
  })

  if (!post) {
    return { title: 'Post introuvable — 3l4n' }
  }

  const title = `Post de ${post.user.name ?? 'quelqu\'un'} sur 3l4n`
  const description = post.content.slice(0, 160)
  const url = `https://3l4n.com/post/${id}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: '3l4n',
      type: 'article',
      ...(post.imageUrl ? { images: [{ url: post.imageUrl, width: 1200, height: 630 }] } : {}),
    },
    twitter: {
      card: post.imageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(post.imageUrl ? { images: [post.imageUrl] } : {}),
    },
  }
}

export default async function SharedPostPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          image: true,
        },
      },
      reactions: {
        select: { id: true, type: true, userId: true },
      },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatar: true, image: true },
          },
        },
      },
    },
  })

  if (!post) notFound()

  const { user, comments, ...rest } = post

  const normalizedPost = {
    ...rest,
    imageUrl: post.imageUrl ?? null,
    createdAt: post.createdAt.toISOString(),
    author: {
      ...user,
      name: user.name ?? 'Utilisateur',
    },
    comments: comments.map(({ user: commentUser, ...c }) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      author: {
        ...commentUser,
        name: commentUser.name ?? 'Utilisateur',
      },
    })),
  }

  return (
    <SharedPostView
      post={normalizedPost}
      currentUserId={session?.user?.id}
    />
  )
}
