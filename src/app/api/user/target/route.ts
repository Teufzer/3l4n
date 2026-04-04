import { NextResponse } from 'next/server'

// POST /api/user/target — targetWeight field removed from schema
// This endpoint is deprecated; kept as a stub to avoid 404s
export async function POST() {
  return NextResponse.json({ error: 'Endpoint non disponible' }, { status: 410 })
}
