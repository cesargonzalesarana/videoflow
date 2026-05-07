import { NextRequest, NextResponse } from 'next/server'
import { getValidAccessToken, uploadToYouTube } from '@/lib/youtube'
import { refreshAccessToken, getYouTubeChannel } from '@/lib/youtube'
import type { YouTubeToken } from '@/lib/youtube'

export async function POST(request: NextRequest) {
  try {
    // ─── Verificar que hay token guardado ───────────────────────
    const tokenCookie = request.cookies.get('youtube_token')
    if (!tokenCookie?.value) {
      return NextResponse.json(
        { error: 'No hay cuenta de YouTube conectada. Conecta tu cuenta primero.' },
        { status: 401 }
      )
    }

    let token: YouTubeToken
    try {
      token = JSON.parse(tokenCookie.value)
    } catch {
      return NextResponse.json(
        { error: 'Token inválido. Reconecta tu cuenta de YouTube.' },
        { status: 401 }
      )
    }

    // ─── Recibir datos del formulario (multipart) ───────────────
    const formData = await request.formData()
    const file = formData.get('video') as File | null
    const title = (formData.get('title') as string) || 'Video sin título'
    const description = (formData.get('description') as string) || ''
    const tagsRaw = (formData.get('tags') as string) || ''
    const privacy = (formData.get('privacy') as string) || 'private'

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió el archivo de video' },
        { status: 400 }
      )
    }

    // ─── Validar tamaño (máximo 128GB por YouTube) ──────────────
    if (file.size > 128 * 1024 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'El video excede el límite de 128GB' },
        { status: 400 }
      )
    }

    // ─── Obtener token válido (refrescar si expiró) ─────────────
    let accessToken = token.access_token
    try {
      accessToken = await getValidAccessToken(token)
    } catch {
      // Token expirado y refresh falló
      return NextResponse.json(
        { error: 'La sesión expiró. Reconecta tu cuenta de YouTube.' },
        { status: 401 }
      )
    }

    // ─── Parsear tags ───────────────────────────────────────────
    const tags = tagsRaw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)

    // ─── Validar privacidad ─────────────────────────────────────
    const validPrivacy = ['public', 'unlisted', 'private'].includes(privacy)
      ? privacy
      : 'private'

    // ─── Subir a YouTube ────────────────────────────────────────
    const result = await uploadToYouTube(accessToken, file, {
      title,
      description,
      tags,
      privacyStatus: validPrivacy as 'public' | 'unlisted' | 'private',
    })

    // ─── Actualizar token en cookie por si se refrescó ──────────
    try {
      let channelInfo = token.channel
      try {
        channelInfo = await getYouTubeChannel(accessToken)
      } catch { /* mantener el anterior */ }

      const updatedToken = {
        ...token,
        access_token: accessToken,
        channel: channelInfo,
      }

      const response = NextResponse.json({
        success: true,
        video: result,
        message: `Video "${result.title}" subido exitosamente`,
      })

      response.cookies.set('youtube_token', JSON.stringify(updatedToken), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
      })

      return response
    } catch {
      // Si falla actualizar cookie, igual devolver éxito
      return NextResponse.json({
        success: true,
        video: result,
        message: `Video "${result.title}" subido exitosamente`,
      })
    }
  } catch (error: any) {
    console.error('YouTube upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir el video a YouTube' },
      { status: 500 }
    )
  }
}