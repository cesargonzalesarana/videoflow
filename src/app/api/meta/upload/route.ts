import { NextRequest, NextResponse } from 'next/server'
import { getValidMetaToken, uploadToFacebook } from '@/lib/meta'
import { createInstagramVideoContainer, checkInstagramContainerStatus, publishInstagramContainer } from '@/lib/meta'
import type { MetaToken } from '@/lib/meta'

export async function POST(request: NextRequest) {
  try {
    // ─── Verificar token ────────────────────────────────────────
    const tokenCookie = request.cookies.get('meta_token')
    if (!tokenCookie?.value) {
      return NextResponse.json(
        { error: 'No hay cuenta de Meta conectada. Conecta tu cuenta primero.' },
        { status: 401 }
      )
    }

    let token: MetaToken & { facebookPages?: any[]; instagramAccounts?: any[] }
    try {
      token = JSON.parse(tokenCookie.value)
    } catch {
      return NextResponse.json(
        { error: 'Token inválido. Reconecta tu cuenta de Meta.' },
        { status: 401 }
      )
    }

    // ─── Recibir datos ──────────────────────────────────────────
    const formData = await request.formData()
    const file = formData.get('video') as File | null
    const title = (formData.get('title') as string) || 'Video'
    const description = (formData.get('description') as string) || ''
    const hashtags = (formData.get('hashtags') as string) || ''
    const platform = (formData.get('platform') as string) || 'facebook'
    const pageId = (formData.get('pageId') as string) || ''
    const privacy = (formData.get('privacy') as string) || 'PUBLIC'

    if (!file) {
      return NextResponse.json(
        { error: 'No se recibió el archivo de video' },
        { status: 400 }
      )
    }

    // ─── Validar plataforma ──────────────────────────────────────
    if (!['facebook', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Plataforma no válida. Usa "facebook" o "instagram".' },
        { status: 400 }
      )
    }

    // ─── Obtener token válido ───────────────────────────────────
    let accessToken = token.access_token
    try {
      accessToken = await getValidMetaToken(token)
    } catch {
      return NextResponse.json(
        { error: 'La sesión expiró. Reconecta tu cuenta de Meta.' },
        { status: 401 }
      )
    }

    // ─── Subir a Facebook ───────────────────────────────────────
    if (platform === 'facebook') {
      // Buscar la página seleccionada
      const pages = token.facebookPages || []
      let selectedPage = pages[0]

      if (pageId) {
        selectedPage = pages.find((p: any) => p.id === pageId) || pages[0]
      }

      if (!selectedPage) {
        return NextResponse.json(
          { error: 'No se encontró una Página de Facebook. Crea una página primero.' },
          { status: 400 }
        )
      }

      try {
        const result = await uploadToFacebook(
          selectedPage.id,
          selectedPage.access_token,
          file,
          {
            title,
            description: description + (hashtags ? '\n\n' + hashtags : ''),
            privacy: privacy as 'PUBLIC' | 'FRIENDS' | 'ME_ONLY',
          }
        )

        return NextResponse.json({
          success: true,
          video: result,
          message: `Video subido a Facebook en la página "${selectedPage.name}"`,
        })
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error al subir a Facebook: ${err.message}` },
          { status: 500 }
        )
      }
    }

    // ─── Subir a Instagram (Reels) ──────────────────────────────
    if (platform === 'instagram') {
      const igAccounts = token.instagramAccounts || []

      if (igAccounts.length === 0) {
        return NextResponse.json(
          { error: 'No se encontró cuenta de Instagram profesional. Vincula tu Instagram a una Página de Facebook.' },
          { status: 400 }
        )
      }

      // Usar la primera cuenta de Instagram (o buscar por pageId)
      let selectedIG = igAccounts[0]
      if (pageId) {
        selectedIG = igAccounts.find((ig: any) => ig.pageId === pageId) || igAccounts[0]
      }

      // Instagram requiere una URL pública del video
      // Subimos primero a un servicio temporal para obtener URL
      try {
        // Paso 1: Subir video temporalmente para obtener URL pública
        const uploadFormData = new FormData()
        uploadFormData.append('file', file)

        // Usamos un servicio de hosting temporal para la URL
        const tempUploadResponse = await fetch('https://file.io', {
          method: 'POST',
          body: uploadFormData,
        })

        let videoUrl = ''
        if (tempUploadResponse.ok) {
          const tempData = await tempUploadResponse.json()
          videoUrl = tempData.link
        }

        if (!videoUrl) {
          return NextResponse.json(
            { error: 'No se pudo obtener una URL pública para el video. Instagram requiere una URL accesible.' },
            { status: 500 }
          )
        }

        // Paso 2: Crear contenedor de Reel en Instagram
        const caption = title + (description ? '\n\n' + description : '') + (hashtags ? '\n\n' + hashtags : '')
        const containerId = await createInstagramVideoContainer(
          selectedIG.id,
          selectedIG.pageAccessToken,
          videoUrl,
          { caption }
        )

        // Paso 3: Esperar a que Instagram procese el video
        let status = 'IN_PROGRESS'
        let attempts = 0
        const maxAttempts = 30 // Máximo ~2.5 minutos esperando

        while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
          await new Promise((r) => setTimeout(r, 5000)) // Esperar 5s entre checks
          status = await checkInstagramContainerStatus(containerId, selectedIG.pageAccessToken)
          attempts++
        }

        if (status !== 'FINISHED') {
          return NextResponse.json(
            { error: `Instagram no terminó de procesar el video. Estado: ${status}` },
            { status: 500 }
          )
        }

        // Paso 4: Publicar el Reel
        const result = await publishInstagramContainer(
          selectedIG.id,
          containerId,
          selectedIG.pageAccessToken
        )

        return NextResponse.json({
          success: true,
          video: result,
          message: `Reel publicado en Instagram @${selectedIG.username}`,
        })
      } catch (err: any) {
        return NextResponse.json(
          { error: `Error al publicar en Instagram: ${err.message}` },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ error: 'Plataforma no reconocida' }, { status: 400 })
  } catch (error: any) {
    console.error('Meta upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Error al subir el video' },
      { status: 500 }
    )
  }
}