import { NextRequest, NextResponse } from 'next/server'
import { getValidInstagramToken, uploadToInstagram } from '@/lib/instagram'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('instagram_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Instagram no conectado' }, { status: 401 })
    }

    const tokenData = JSON.parse(token)
    const validToken = await getValidInstagramToken(tokenData)

    const igAccount = validToken.instagram_account
    if (!igAccount) {
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

    // Publicar en Instagram
    const mediaId = await uploadToInstagram(
      igAccount.id,
      igAccount.pageAccessToken,
      videoUrl,
      caption
    )

    return NextResponse.json({
      success: true,
      mediaId,
      url: `https://www.instagram.com/`,
    })
  } catch (err: any) {
    console.error('Instagram upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}