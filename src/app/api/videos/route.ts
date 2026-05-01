import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If no userId, return empty (don't error)
    if (!userId) {
      return NextResponse.json({ videos: [] })
    }

    let videos: any[] = []
    try {
      const { db } = await import('@/lib/db')
      const result = await db.video.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      })
      videos = Array.isArray(result) ? result : []
    } catch (dbError) {
      console.error('DB not available for videos:', dbError)
      videos = []
    }

    return NextResponse.json({ videos: videos || [] })
  } catch (error) {
    console.error('Videos GET error:', error)
    return NextResponse.json({ videos: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, description, status, videoUrl, thumbnailUrl, duration, resolution, format } = body

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId y title son requeridos' }, { status: 400 })
    }

    try {
      const { db } = await import('@/lib/db')
      const video = await db.video.create({
        data: {
          userId, title, description,
          status: status || 'draft',
          videoUrl: videoUrl || null,
          thumbnailUrl: thumbnailUrl || null,
          duration: duration || null,
          resolution: resolution || null,
          format: format || null,
        }
      })
      return NextResponse.json({ video })
    } catch (dbError) {
      console.error('DB create video error:', dbError)
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 503 })
    }
  } catch (error) {
    console.error('Videos POST error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    try {
      const { db } = await import('@/lib/db')
      const video = await db.video.update({
        where: { id },
        data: updates
      })
      return NextResponse.json({ video })
    } catch (dbError) {
      console.error('DB update video error:', dbError)
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 503 })
    }
  } catch (error) {
    console.error('Videos PUT error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    try {
      const { db } = await import('@/lib/db')
      await db.video.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error('DB delete video error:', dbError)
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 503 })
    }
  } catch (error) {
    console.error('Videos DELETE error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
