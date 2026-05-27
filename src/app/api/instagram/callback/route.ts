import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?instagram_error=true', request.url))
  }

  try {
    const META_APP_ID = process.env.META_APP_ID!
    const META_APP_SECRET = process.env.META_APP_SECRET!
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/instagram/callback`

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${REDIRECT_URI}&code=${code}`,
      { method: 'GET' }
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Instagram token error:', tokenData.error)
      return NextResponse.redirect(new URL('/?instagram_error=true', request.url))
    }

    const shortLivedToken = tokenData.access_token
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`,
      { method: 'GET' }
    )
    const longLivedData = await longLivedRes.json()
    const longLivedToken = longLivedData.access_token || shortLivedToken

    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${longLivedToken}`
    )
    const meData = await meRes.json()

    let instagramBusinessId: string | null = null
    if (meData.data && meData.data.length > 0) {
      const pageToken = meData.data[0].access_token
      const igRes = await fetch(
        `https://graph.facebook.com/v19.0/${meData.data[0].id}?fields=instagram_business_account{id,username}&access_token=${pageToken}`
      )
      const igData = await igRes.json()
      if (igData.instagram_business_account) {
        instagramBusinessId = igData.instagram_business_account.id
      }
    }

    const response = NextResponse.redirect(new URL('/?instagram_connected=true', request.url))
    response.cookies.set('instagram_access_token', longLivedToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60,
      path: '/',
    })
    if (instagramBusinessId) {
      response.cookies.set('instagram_business_id', instagramBusinessId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 60,
        path: '/',
      })
    }
    return response
  } catch (error) {
    console.error('Instagram callback error:', error)
    return NextResponse.redirect(new URL('/?instagram_error=true', request.url))
  }
}