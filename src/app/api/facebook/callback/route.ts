import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/?facebook_error=true', request.url))
  }

  try {
    const META_APP_ID = process.env.META_APP_ID!
    const META_APP_SECRET = process.env.META_APP_SECRET!
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!

    const redirectUri = `${BASE_URL}/api/facebook/callback`

    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&redirect_uri=${redirectUri}&code=${code}`,
      { method: 'GET' }
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      console.error('Facebook token error:', tokenData.error)
      return NextResponse.redirect(new URL('/?facebook_error=true', request.url))
    }

    const shortLivedToken = tokenData.access_token
    const longLivedRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortLivedToken}`,
      { method: 'GET' }
    )
    const longLivedData = await longLivedRes.json()
    const longLivedToken = longLivedData.access_token || shortLivedToken

    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${longLivedToken}`
    )
    const meData = await meRes.json()

    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token&access_token=${longLivedToken}`
    )
    const pagesData = await pagesRes.json()

    const response = NextResponse.redirect(new URL('/?facebook_connected=true', request.url))
    response.cookies.set('facebook_access_token', longLivedToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60,
      path: '/',
    })
    response.cookies.set('facebook_user_info', JSON.stringify({
      id: meData.id,
      name: meData.name,
      email: meData.email,
      pages: pagesData.data || [],
    }), {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Facebook callback error:', error)
    return NextResponse.redirect(new URL('/?facebook_error=true', request.url))
  }
}