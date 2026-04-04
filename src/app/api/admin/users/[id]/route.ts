import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH /api/admin/users/[id]
// body: { banned: boolean }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { banned } = body as { banned: boolean }

    if (typeof banned !== 'boolean') {
      return NextResponse.json({ error: 'Paramètre invalide' }, { status: 400 })
    }

    // Prevent banning yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Tu ne peux pas te bannir toi-même' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data: { banned },
      select: { id: true, name: true, email: true, banned: true, role: true },
    })

    return NextResponse.json({ user })
  } catch (error) {
    console.error('[PATCH /api/admin/users/[id]]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
