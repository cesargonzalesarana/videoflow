import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const projects = await db.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, duration: true,
        thumbnailUrl: true, createdAt: true, updatedAt: true,
      },
    })
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUser(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { name, tracksJson, duration, thumbnailUrl } = body
    if (!name || !tracksJson) {
      return NextResponse.json({ error: 'Name and tracksJson are required' }, { status: 400 })
    }
    const project = await db.project.create({
      data: {
        userId, name, tracksJson,
        duration: duration || 300,
        thumbnailUrl: thumbnailUrl || null,
      },
    })
    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
