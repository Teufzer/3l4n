import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Rate limit: 1 resend per 5 minutes per user
    if (!await rateLimit(`resend-verification:${session.user.id}`, 1, 5 * 60 * 1000)) {
      return NextResponse.json(
        { error: 'Attends 5 minutes avant de renvoyer un email.' },
        { status: 429 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email déjà vérifié' }, { status: 400 })
    }

    // Delete any existing token and create a fresh one
    await prisma.emailVerification.deleteMany({
      where: { userId: session.user.id },
    })

    const verification = await prisma.emailVerification.create({
      data: {
        userId: session.user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    await sendVerificationEmail(user.email, verification.token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
