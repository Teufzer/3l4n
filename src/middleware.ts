import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { nextUrl } = req
  // Tout rediriger vers la page de fermeture sauf les assets
  if (!nextUrl.pathname.startsWith('/_next') && nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)'],
}
