import { NextRequest, NextResponse } from 'next/server'
import { getFacebookAuthUrl } from '@/lib/facebook'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'authorize') {
    const url = getFacebookAuthUrl()
    return NextResponse.json({ url })
  }

  if (action === 'status') {
    const token = request.cookies.get('facebook_token')?.value
    if (!token) {
      return NextResponse.json({ connected: false })
    }
    try {
      const data = JSON.parse(token)
      return NextResponse.json({
        connected: true,
        userName: data.user_name,
        pages: data.pages || [],
      })
    } catch {
      return NextResponse.json({ connected: false })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}