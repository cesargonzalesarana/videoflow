import { NextRequest, NextResponse } from 'next/server'
import { getYouTubeAuthUrl, exchangeCodeForTokens } from '@/lib/youtube'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    // ─── Generar URL de autorización ────────────────────────────
    if (action === 'authorize') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
        request.headers.get('origin') || 
        'http://localhost:3000'
      const redirectUri = `${baseUrl}/api/youtube/callback`
      const authUrl = getYouTubeAuthUrl(redirectUri)

      return NextResponse.json({ url: authUrl })
    }

    // ─── Verificar estado de conexión ───────────────────────────
    if (action === 'status') {
      const tokenCookie = request.cookies.get('youtube_token')
      const connected = !!tokenCookie?.value

      if (connected) {
        try {
          const token = JSON.parse(tokenCookie.value)
          return NextResponse.json({
            connected: true,
            channel: token.channel || null,
          })
        } catch {
          return NextResponse.json({ connected: false })
        }
      }

      return NextResponse.json({ connected: false })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
  } catch (error: any) {
    console.error('YouTube auth error:', error)
    return NextResponse.json(
      { error: error.message || 'Error del servidor' },
      { status: 500 }
    )
  }
}