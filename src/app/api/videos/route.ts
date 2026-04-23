import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthenticatedUser } from '@/lib/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const videos = await db.video.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Videos GET error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request)
    if (!auth.success) return auth.response!

    const body = await request.json()
    const { title, description, status, videoUrl, thumbnailUrl, duration, resolution, format } = body

    if (!title) {
      return NextResponse.json({ error: 'title requerido' }, { status: 400 })
    }

    const video = await db.video.create({
      data: {
        userId: auth.userId,
        title, description,
        status: status || 'draft',
        videoUrl: videoUrl || null,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        resolution: resolution || null,
        format: format || null,
      }
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Videos POST error:', error)
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

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    const video = await db.video.update({
      where: { id },
      data: updates
    })

    return NextResponse.json({ video })
  } catch (error) {
    console.error('Videos PUT error:', error)
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

    const existing = await db.video.findUnique({ where: { id } })
    if (!existing || existing.userId !== auth.userId) {
      return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
    }

    await db.video.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Videos DELETE error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
