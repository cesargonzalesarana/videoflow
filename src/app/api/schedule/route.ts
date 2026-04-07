import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const posts = await db.scheduledPost.findMany({
      where: { userId },
      include: { video: { select: { title: true, thumbnailUrl: true } } },
      orderBy: { scheduledAt: 'asc' }
    })

    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Schedule GET error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
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

    const post = await db.scheduledPost.create({
      data: {
        userId, videoId, platform,
        scheduledAt: new Date(scheduledAt),
        caption: caption || null,
        hashtags: hashtags || null,
      }
    })

    return NextResponse.json({ post })
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

    const post = await db.scheduledPost.update({
      where: { id },
      data: updates
    })

    return NextResponse.json({ post })
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

    await db.scheduledPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Schedule DELETE error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
