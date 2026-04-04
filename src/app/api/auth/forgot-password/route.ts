import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!await rateLimit(`forgot-password:${ip}`, 5, 60 * 60 * 1000)) {
      // Still return success message to avoid leaking info
      return NextResponse.json({
        message: "Si un compte existe avec cet email, tu recevras un lien.",
      })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true },
    })

    // Always return the same message regardless of whether the user exists
    const successResponse = NextResponse.json({
      message: "Si un compte existe avec cet email, tu recevras un lien.",
    })

    if (!user || !user.password) {
      // User doesn't exist or is a Google-only user — don't reveal
      return successResponse
    }

    // Create password reset token (expires in 1 hour)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    const reset = await prisma.passwordReset.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    })

    await sendPasswordResetEmail(user.email, reset.token)

    return successResponse
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}
