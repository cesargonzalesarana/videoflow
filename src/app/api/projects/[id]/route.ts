import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth-helpers'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUser(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const project = await db.project.findFirst({ where: { id, userId } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUser(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const body = await request.json()
    const { name, tracksJson, duration, thumbnailUrl } = body
    const existing = await db.project.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    const project = await db.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tracksJson && { tracksJson }),
        ...(duration !== undefined && { duration }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
      },
    })
    return NextResponse.json({ project })
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getAuthenticatedUser(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params
    const existing = await db.project.findFirst({ where: { id, userId } })
    if (!existing) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    await db.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting project:', error)
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 })
  }
}
