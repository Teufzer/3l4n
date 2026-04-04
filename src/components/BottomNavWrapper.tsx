import { auth } from '@/auth'
import BottomNav from './BottomNav'

export default async function BottomNavWrapper() {
  const session = await auth()

  let profileHref = '/feed'
  if (session?.user) {
    if (session.user.username) {
      profileHref = `/${session.user.username}`
    } else if (session.user.id) {
      profileHref = `/profile/${session.user.id}`
    }
  }

  return <BottomNav profileHref={profileHref} />
}
