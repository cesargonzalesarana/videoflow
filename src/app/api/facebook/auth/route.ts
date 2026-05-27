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
    const token = request.cookies.get('facebook_access_token')?.value
    const userInfoCookie = request.cookies.get('facebook_user_info')?.value

    if (!token) {
      return NextResponse.json({ connected: false })
    }
    try {
      let userInfo: any = {}
      if (userInfoCookie) {
        userInfo = JSON.parse(userInfoCookie)
      }
      return NextResponse.json({
        connected: true,
        userName: userInfo.name || 'Facebook User',
        pages: userInfo.pages || [],
      })
    } catch {
      return NextResponse.json({ connected: false })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}