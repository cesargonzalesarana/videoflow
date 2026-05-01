import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    // If no userId, return empty (don't error)
    if (!userId) {
      return NextResponse.json({ posts: [] })
    }

    let posts: any[] = []
    try {
      const { db } = await import('@/lib/db')
      const result = await db.scheduledPost.findMany({
        where: { userId },
        include: { video: { select: { title: true, thumbnailUrl: true } } },
        orderBy: { scheduledAt: 'asc' }
      })
      posts = Array.isArray(result) ? result : []
    } catch (dbError) {
      console.error('DB not available for schedule:', dbError)
      posts = []
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Schedule GET error:', error)
    return NextResponse.json({ posts: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, videoId, platform, scheduledAt, caption, hashtags } = body

    if (!userId || !videoId || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'userId, videoId, platform y scheduledAt son requeridos' },
        { status: 400 }
      )
    }

    try {
      const { db } = await import('@/lib/db')
      const post = await db.scheduledPost.create({
        data: {
          userId, videoId, platform,
          scheduledAt: new Date(scheduledAt),
          caption: caption || null,
          hashtags: hashtags || null,
        }
      })
      return NextResponse.json({ post })
    } catch (dbError) {
      console.error('DB create schedule error:', dbError)
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 503 })
    }
  } catch (error) {
    console.error('Schedule POST error:', error)
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

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt)
    }

    try {
      const { db } = await import('@/lib/db')
      const post = await db.scheduledPost.update({
        where: { id },
        data: updates
      })
      return NextResponse.json({ post })
    } catch (dbError) {
      console.error('DB update schedule error:', dbError)
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 503 })
    }
  } catch (error) {
    console.error('Schedule PUT error:', error)
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
      await db.scheduledPost.delete({ where: { id } })
      return NextResponse.json({ success: true })
    } catch (dbError) {
      console.error('DB delete schedule error:', dbError)
      return NextResponse.json({ error: 'Base de datos no disponible' }, { status: 503 })
    }
  } catch (error) {
    console.error('Schedule DELETE error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
