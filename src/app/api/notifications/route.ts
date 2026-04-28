import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Generate notifications based on user activity
    const now = new Date()
    const notifications = [
      {
        id: 'sample-1',
        title: 'Bienvenido a VideoFlow',
        message: 'Comienza creando tu primer video o explora las tendencias con IA.',
        type: 'info',
        read: true,
        createdAt: new Date(now.getTime() - 3600000).toISOString(),
        icon: 'info',
      },
      {
        id: 'sample-2',
        title: 'Prueba el editor de video',
        message: 'Nuestro editor con timeline te permite crear videos profesionales desde tu navegador.',
        type: 'info',
        read: false,
        createdAt: new Date(now.getTime() - 600000).toISOString(),
        icon: 'video',
      },
      {
        id: 'sample-3',
        title: 'Programa tus publicaciones',
        message: 'Publica en YouTube, TikTok, Instagram y Facebook desde un solo lugar.',
        type: 'info',
        read: false,
        createdAt: new Date(now.getTime() - 1800000).toISOString(),
        icon: 'calendar',
      },
    ]

    return NextResponse.json({ notifications })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener notificaciones' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()

    // In a real app, mark notifications as read in database
    // For now, just acknowledge
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()

    // In a real app, delete notification from database
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 })
  }
}
