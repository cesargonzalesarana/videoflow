import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, getFacebookPages, getInstagramAccount } from '@/lib/meta'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      request.headers.get('origin') || 
      'http://localhost:3000'

    // ─── Usuario canceló o hubo error ───────────────────────────
    if (error) {
      return NextResponse.redirect(`${baseUrl}/editor?meta_error=${error}`)
    }

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/editor?meta_error=no_code`)
    }

    // ─── Intercambiar code por token ─────────────────────────────
    const redirectUri = `${baseUrl}/api/meta/callback`
    const token = await exchangeCodeForToken(code, redirectUri)

    // ─── Obtener nombre del usuario ──────────────────────────────
    let userName = null
    try {
      const userResponse = await fetch(
        `https://graph.facebook.com/v19.0/me?fields=name`,
        {
          headers: { Authorization: `Bearer ${token.access_token}` },
        }
      )
      if (userResponse.ok) {
        const userData = await userResponse.json()
        userName = userData.name
      }
    } catch { /* continuar sin nombre */ }

    // ─── Obtener Páginas de Facebook ─────────────────────────────
    let facebookPages = []
    try {
      facebookPages = await getFacebookPages(token.access_token)
    } catch {
      console.error('No se pudieron obtener páginas de Facebook')
    }

    // ─── Obtener cuentas de Instagram vinculadas ─────────────────
    let instagramAccounts = []
    for (const page of facebookPages) {
      try {
        const igAccount = await getInstagramAccount(page.id, page.access_token)
        if (igAccount) {
          instagramAccounts.push({
            ...igAccount,
            pageId: page.id,
            pageAccessToken: page.access_token,
          })
        }
      } catch { /* esa página no tiene Instagram */ }
    }

    // ─── Guardar token en cookie ────────────────────────────────
    const tokenData = {
      access_token: token.access_token,
      expires_at: token.expires_at,
      user_id: token.user_id,
      userName,
      facebookPages,
      instagramAccounts,
    }

    const response = NextResponse.redirect(
      `${baseUrl}/editor?meta_connected=true`
    )

    response.cookies.set('meta_token', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 días (token de larga duración)
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Meta callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      request.headers.get('origin') || 
      'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/editor?meta_error=${encodeURIComponent(error.message)}`
    )
  }
}