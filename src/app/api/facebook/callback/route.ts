import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  getFacebookPages,
} from '@/lib/facebook'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const state = searchParams.get('state')

  // Si es Instagram, redirigir al callback de Instagram
  if (state === 'instagram') {
    const redirectUrl = new URL('/api/instagram/callback', request.url)
    redirectUrl.searchParams.set('code', code || '')
    if (error) redirectUrl.searchParams.set('error', error)
    return NextResponse.redirect(redirectUrl.toString())
  }

  if (error) {
    console.error('Facebook auth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?facebook_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?facebook_error=no_code`
    )
  }

  try {
    // Intercambiar code por token
    const tokenData = await exchangeCodeForToken(code)

    // Obtener nombre del usuario
    const meRes = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=name&access_token=${tokenData.access_token}`
    )
    const meData = await meRes.json()
    const userName = meData.name || 'Facebook User'

    // Obtener páginas de Facebook
    const pages = await getFacebookPages(tokenData.access_token)

    // Guardar en cookie
    const cookieData = {
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      user_name: userName,
      pages: pages.map((p: any) => ({
        id: p.id,
        name: p.name,
        access_token: p.access_token,
        picture: p.picture?.data?.url || null,
      })),
    }

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?facebook_connected=true`
    )

    response.cookies.set('facebook_token', JSON.stringify(cookieData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('Facebook callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?facebook_error=${encodeURIComponent(err.message)}`
    )
  }
}