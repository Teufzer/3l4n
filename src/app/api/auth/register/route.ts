import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'
import { sendVerificationEmail } from '@/lib/email'

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 inscriptions par IP par heure
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (!await rateLimit(`register:${ip}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessaie dans une heure.' }, { status: 429 })
    }

    const { email, password, name, username } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, nom et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit faire au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Validate username if provided
    if (username) {
      if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          { error: 'Le @username doit faire 3 à 30 caractères (lettres, chiffres, _)' },
          { status: 400 }
        )
      }

      const existingUsername = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
      })

      if (existingUsername) {
        return NextResponse.json(
          { error: 'Ce @username est déjà pris' },
          { status: 409 }
        )
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        ...(username ? { username: username.toLowerCase() } : {}),
      },
    })

    // Create email verification token
    const verification = await prisma.emailVerification.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    })

    // Send verification email (non-blocking — don't fail registration if email fails)
    sendVerificationEmail(user.email, verification.token).catch((err) =>
      console.error('Failed to send verification email:', err)
    )

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
