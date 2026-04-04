import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token manquant' }, { status: 400 })
    }

    const verification = await prisma.emailVerification.findUnique({
      where: { token },
    })

    if (!verification) {
      return NextResponse.json({ error: 'Lien invalide ou expiré' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: verification.userId },
        data: { emailVerified: new Date() },
      }),
      prisma.emailVerification.delete({
        where: { token },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
