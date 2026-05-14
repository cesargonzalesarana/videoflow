import { NextRequest, NextResponse } from 'next/server'
import {
  exchangeCodeForToken,
  getFacebookPagesForIG,
  getInstagramAccount,
} from '@/lib/instagram'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    console.error('Instagram auth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?instagram_error=${encodeURIComponent(error)}`
    )
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?instagram_error=no_code`
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
    const userName = meData.name || 'Instagram User'

    // Obtener páginas del usuario (necesarias para encontrar cuenta IG)
    const pages = await getFacebookPagesForIG(tokenData.access_token)

    // Buscar cuenta de Instagram Business vinculada a una página
    let instagramAccount = null
    for (const page of pages) {
      try {
        const igAccount = await getInstagramAccount(page.id, page.access_token)
        if (igAccount) {
          instagramAccount = {
            id: igAccount.id,
            username: igAccount.username,
            pageId: page.id,
            pageAccessToken: page.access_token,
          }
          break
        }
      } catch {
        continue
      }
    }

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
      })),
      instagram_account: instagramAccount,
    }

    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?instagram_connected=true`
    )

    response.cookies.set('instagram_token', JSON.stringify(cookieData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('Instagram callback error:', err)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || ''}/editor?instagram_error=${encodeURIComponent(err.message)}`
    )
  }
}