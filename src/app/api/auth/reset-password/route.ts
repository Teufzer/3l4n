import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Token et mot de passe requis' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit faire au moins 8 caractères' },
        { status: 400 }
      )
    }

    const reset = await prisma.passwordReset.findUnique({
      where: { token },
    })

    if (!reset) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    }

    if (reset.used) {
      return NextResponse.json({ error: 'Ce lien a déjà été utilisé' }, { status: 400 })
    }

    if (reset.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Ce lien a expiré' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await prisma.$transaction([
      prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      prisma.passwordReset.update({
        where: { token },
        data: { used: true },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
