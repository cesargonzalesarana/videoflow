import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requerido' }, { status: 400 })
    }

    const videos = await db.video.findMany({
      where: { userId },
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
    const body = await request.json()
    const { userId, title, description, status, videoUrl, thumbnailUrl, duration, resolution, format } = body

    if (!userId || !title) {
      return NextResponse.json({ error: 'userId y title son requeridos' }, { status: 400 })
    }

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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 })
    }

    await db.video.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Videos DELETE error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
