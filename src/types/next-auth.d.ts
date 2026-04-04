import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: 'USER' | 'ADMIN'
      banned: boolean
      verified?: boolean
      username?: string | null
    } & DefaultSession['user']
  }
}
