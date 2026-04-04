import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Rate limit login: 10 tentatives / 15 min par email
        if (!await rateLimit(`login:${credentials.email}`, 10, 15 * 60 * 1000)) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar || null, // jamais la photo Google
          role: user.role,
          banned: user.banned,
          username: user.username,
          isCredentialsUser: true,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    newUser: '/register',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.image = null // on n'utilise pas la photo Google
        token.role = (user as { role?: string }).role
        token.banned = (user as { banned?: boolean }).banned
        token.username = (user as { username?: string | null }).username
        token.isCredentialsUser = (user as { isCredentialsUser?: boolean }).isCredentialsUser ?? false
      }
      // Refresh role/banned/image from DB on each token refresh
      if (token.id && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, banned: true, image: true, avatar: true, username: true, name: true, verified: true, emailVerified: true, accounts: { select: { provider: true } } },
        })
        if (dbUser) {
          token.role = dbUser.role
          token.banned = dbUser.banned
          token.name = dbUser.name
          // Uniquement l'avatar R2, jamais la photo Google
          token.image = dbUser.avatar || null
          token.username = dbUser.username
          token.verified = dbUser.verified
          token.emailVerified = dbUser.emailVerified
          token.isCredentialsUser = dbUser.accounts.length === 0 || !dbUser.accounts.some((a: { provider: string }) => a.provider === 'google')
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.image = token.image as string
        session.user.role = token.role as 'USER' | 'ADMIN'
        session.user.banned = token.banned as boolean
        session.user.username = token.username as string | null | undefined
        session.user.verified = token.verified as boolean
        session.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null
        session.user.isCredentialsUser = token.isCredentialsUser as boolean | undefined
      }
      return session
    },
  },
})
