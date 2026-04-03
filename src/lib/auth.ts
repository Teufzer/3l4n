/**
 * Auth helpers — wrapper autour de NextAuth v5.
 */
import { auth } from '@/auth'

/**
 * Récupère l'userId de l'utilisateur connecté via la session NextAuth.
 * Retourne null si non authentifié.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}
