import { auth } from '@/auth'
import BottomNav from './BottomNav'

export default async function BottomNavWrapper() {
  const session = await auth()
  const profileHref = session?.user?.id
    ? `/profile/${session.user.id}`
    : '/profile'

  return <BottomNav profileHref={profileHref} />
}
