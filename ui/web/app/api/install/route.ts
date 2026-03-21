import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:2700'

/** GET /api/install — fetch parsed package lists from the backend */
export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/packages`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Backend responded ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

/** POST /api/install — trigger a dependency install on the backend */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const res = await fetch(`${BACKEND_URL}/api/install`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.ok ? 200 : 502 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
