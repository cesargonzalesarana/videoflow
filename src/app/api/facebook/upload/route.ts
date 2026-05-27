import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('facebook_access_token')?.value
    const userInfoCookie = request.cookies.get('facebook_user_info')?.value

    if (!token) {
      return NextResponse.json({ error: 'Facebook no conectado' }, { status: 401 })
    }

    let userInfo: any = {}
    if (userInfoCookie) {
      try { userInfo = JSON.parse(userInfoCookie) } catch { /* ignore */ }
    }

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
    const pages = userInfo.pages || []
    const page = pages.find((p: any) => p.id === pageId)
    if (!page) {
      return NextResponse.json({ error: 'Página no encontrada' }, { status: 400 })
    }

    const buffer = Buffer.from(await videoFile.arrayBuffer())

    const fbFormData = new FormData()
    fbFormData.append('file', new Blob([buffer], { type: 'video/mp4' }), 'video.mp4')
    fbFormData.append('title', title)
    fbFormData.append('description', description)

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/videos?access_token=${page.access_token}`,
      {
        method: 'POST',
        body: fbFormData,
      }
    )

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(`Facebook upload error: ${JSON.stringify(err)}`)
    }

    const result = await res.json()
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