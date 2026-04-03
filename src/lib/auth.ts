/**
 * Auth helpers — à connecter avec NextAuth v5 quand la config sera prête.
 * En attendant, on expose un helper `getCurrentUserId` utilisable dans les API routes.
 */
import { cookies } from 'next/headers'

/**
 * Récupère l'userId depuis la session/cookie.
 * À remplacer par `const session = await auth(); return session?.user?.id` quand NextAuth est configuré.
 */
export async function getCurrentUserId(): Promise<string | null> {
  // Placeholder : lit un cookie de session basique
  // TODO: remplacer par la vraie logique NextAuth v5
  const cookieStore = await cookies()
  const userId = cookieStore.get('userId')?.value ?? null
  return userId
}
