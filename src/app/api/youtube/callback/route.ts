import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getYouTubeChannel } from '@/lib/youtube'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // ─── Usuario canceló o hubo error ───────────────────────────
    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        request.headers.get('origin') || 
        'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/editor?youtube_error=${error}`)
    }

    if (!code) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        request.headers.get('origin') || 
        'http://localhost:3000'
      return NextResponse.redirect(`${baseUrl}/editor?youtube_error=no_code`)
    }

    // ─── Construir redirect URI (debe coincidir exactamente) ────
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      request.headers.get('origin') || 
      'http://localhost:3000'
    const redirectUri = `${baseUrl}/api/youtube/callback`

    // ─── Intercambiar code por tokens ───────────────────────────
    const token = await exchangeCodeForTokens(code, redirectUri)

    // ─── Obtener info del canal ─────────────────────────────────
    let channel = null
    try {
      channel = await getYouTubeChannel(token.access_token)
    } catch (err) {
      console.error('No se pudo obtener canal, pero token guardado:', err)
    }

    // ─── Guardar token en cookie (httpOnly por seguridad) ───────
    const tokenData = {
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: token.expires_at,
      channel,
    }

    const response = NextResponse.redirect(
      `${baseUrl}/editor?youtube_connected=true`
    )

    response.cookies.set('youtube_token', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 año (usa refresh_token)
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('YouTube callback error:', error)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      request.headers.get('origin') || 
      'http://localhost:3000'
    return NextResponse.redirect(
      `${baseUrl}/editor?youtube_error=${encodeURIComponent(error.message)}`
    )
  }
}