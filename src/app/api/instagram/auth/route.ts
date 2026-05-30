import { NextRequest, NextResponse } from 'next/server'
import { getInstagramAuthUrl } from '@/lib/instagram'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'authorize') {
    const url = getInstagramAuthUrl()
    return NextResponse.json({ url })
  }

  if (action === 'status') {
    const token = request.cookies.get('instagram_access_token')?.value
    const businessId = request.cookies.get('instagram_business_id')?.value

    if (!token) {
      return NextResponse.json({ connected: false })
    }
    try {
      return NextResponse.json({
        connected: true,
        userName: 'Instagram User',
        instagramAccount: businessId ? { id: businessId } : null,
      })
    } catch {
      return NextResponse.json({ connected: false })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}