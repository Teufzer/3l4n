'use client'

import { usePathname } from 'next/navigation'
import Sidebar from './Sidebar'

const PUBLIC_ROUTES = ['/', '/login', '/register']

export default function SidebarWrapper() {
  const pathname = usePathname()
  if (PUBLIC_ROUTES.includes(pathname)) return null
  return <Sidebar />
}
