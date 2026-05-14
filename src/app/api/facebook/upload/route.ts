import { NextRequest, NextResponse } from 'next/server'
import { getValidFacebookToken, uploadToFacebook } from '@/lib/facebook'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('facebook_token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Facebook no conectado' }, { status: 401 })
    }

    const tokenData = JSON.parse(token)
    const validToken = await getValidFacebookToken(tokenData)

    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const pageId = formData.get('pageId') as string
    const title = (formData.get('title') as string) || 'Video from VideoFlow'
    const description = (formData.get('description') as string) || ''

    if (!videoFile || !pageId) {
      return NextResponse.json(
        { error: 'Falta el video o la página' },
        { status: 400 }
      )
    }

    // Encontrar la página seleccionada
    const page = validToken.pages.find((p: any) => p.id === pageId)
    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 400 })
    }

    const buffer = Buffer.from(await videoFile.arrayBuffer())

    const result = await uploadToFacebook(
      page.access_token,
      pageId,
      buffer,
      title,
      description
    )

    return NextResponse.json({
      success: true,
      videoId: result.id,
      url: `https://www.facebook.com/${pageId}/videos/${result.id}`,
    })
  } catch (err: any) {
    console.error('Facebook upload error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}