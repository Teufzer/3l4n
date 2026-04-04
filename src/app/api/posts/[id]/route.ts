import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET /api/posts/[id] — public, returns post with author + reactions + comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const { user, comments, ...rest } = post

    const normalized = {
      ...rest,
      author: user,
      comments: comments.map(({ user: commentUser, ...c }) => ({
        ...c,
        author: commentUser,
      })),
    }

    return NextResponse.json({ post: normalized })
  } catch (error) {
    console.error('[GET /api/posts/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// PATCH /api/posts/[id] — modifier le contenu (auth requise, auteur seulement)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { content } = body

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Contenu invalide' }, { status: 400 })
    }

    const post = await prisma.post.findUnique({ where: { id } })

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content: content.trim(),
        editedAt: new Date(),
        // Première modification : on sauvegarde le contenu original
        ...(post.originalContent === null && { originalContent: post.content }),
      },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatar: true, image: true },
        },
        reactions: { select: { id: true, type: true, userId: true } },
      },
    })

    const { user, ...rest } = updatedPost
    return NextResponse.json({ post: { ...rest, author: user } })
  } catch (error) {
    console.error('[PATCH /api/posts/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// DELETE /api/posts/[id] — supprimer un post (auth requise, auteur ou ADMIN)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { id } = await params

    const post = await prisma.post.findUnique({ where: { id } })

    if (!post) {
      return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    }

    const isAuthor = post.userId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    await prisma.post.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DELETE /api/posts/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
