import { NextRequest, NextResponse } from 'next/server'

const protectedRoutes = ['/dashboard', '/settings', '/admin']
const authRoutes = ['/login', '/register']

export function middleware(req: NextRequest) {
  const { nextUrl } = req

  // Check for NextAuth session token (works in Edge)
  const sessionToken =
    req.cookies.get('authjs.session-token')?.value ||
    req.cookies.get('__Secure-authjs.session-token')?.value

  const isLoggedIn = !!sessionToken

  const isProtectedRoute = protectedRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  )

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
