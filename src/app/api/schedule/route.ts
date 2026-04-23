import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const posts = await db.scheduledPost.findMany({
      where: { userId: auth.userId },
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
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const body = await request.json()
    const { videoId, platform, scheduledAt, caption, hashtags } = body

    if (!videoId || !platform || !scheduledAt) {
      return NextResponse.json(
        { error: 'videoId, platform y scheduledAt son requeridos' },
        { status: 400 }
      )
    }

    const post = await db.scheduledPost.create({
      data: {
        userId: auth.userId,
        videoId, platform,
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
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    if (updates.scheduledAt) {
      updates.scheduledAt = new Date(updates.scheduledAt)
    }

    const existing = await db.scheduledPost.findUnique({ where: { id } })
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
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
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    const existing = await db.scheduledPost.findUnique({ where: { id } })
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    await db.scheduledPost.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Schedule DELETE error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
