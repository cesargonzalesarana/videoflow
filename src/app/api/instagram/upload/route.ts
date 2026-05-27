import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('instagram_access_token')?.value
    const businessIdCookie = request.cookies.get('instagram_business_id')?.value

    if (!token) {
      return NextResponse.json({ error: 'Instagram no conectado' }, { status: 401 })
    }

    if (!businessIdCookie) {
      return NextResponse.json(
        { error: 'No se encontró cuenta de Instagram Business vinculada' },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const caption = (formData.get('caption') as string) || 'Publicado desde VideoFlow'

    if (!videoFile) {
      return NextResponse.json({ error: 'Falta el video' }, { status: 400 })
    }

    // Subir video a host temporal para obtener URL pública
    const buffer = Buffer.from(await videoFile.arrayBuffer())
    const tempUploadRes = await fetch('https://file.io', {
      method: 'POST',
      body: (() => {
        const fd = new FormData()
        fd.append('file', new Blob([buffer], { type: 'video/mp4' }), 'video.mp4')
        return fd
      })(),
    })

    if (!tempUploadRes.ok) {
      throw new Error('Failed to upload video to temporary host')
    }

    const tempData = await tempUploadRes.json()
    const videoUrl = tempData.link

    if (!videoUrl) {
      throw new Error('No se obtuvo URL del video temporal')
    }

    const igUserId = businessIdCookie

    // Paso 1: Crear contenedor de Reel
    const createRes = await fetch(
      `https://graph.facebook.com/v19.0/${igUserId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&share_to_feed=true&access_token=${token}`,
      { method: 'POST' }
    )

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}))
      throw new Error(`Instagram container error: ${JSON.stringify(err)}`)
    }

    const containerData = await createRes.json()
    const containerId = containerData.id

    // Paso 2: Esperar y verificar estado del contenedor
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 10000))

      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${token}`
      )
      if (!statusRes.ok) continue
      const statusData = await statusRes.json()

      if (statusData.status_code === 'FINISHED') {
        // Paso 3: Publicar
        const publishRes = await fetch(
          `https://graph.facebook.com/v19.0/${igUserId}/media_publish?creation_id=${containerId}&access_token=${token}`,
          { method: 'POST' }
        )
        if (!publishRes.ok) {
          const err = await publishRes.json().catch(() => ({}))
          throw new Error(`Instagram publish error: ${JSON.stringify(err)}`)
        }
        const publishData = await publishRes.json()
        return NextResponse.json({
          success: true,
          mediaId: publishData.id,
          url: `https://www.instagram.com/`,
        })
      } else if (statusData.status_code === 'ERROR') {
        throw new Error('Instagram video processing failed')
      }
    }

    throw new Error('Instagram video processing timed out')
  } catch (err: any) {
    console.error('Instagram upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}