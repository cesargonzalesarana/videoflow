import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success } = rateLimit(ip, 5, 60000)
  if (!success) { return NextResponse.json({ error: 'Demasiadas subidas. Intenta en un minuto.' }, { status: 429 }) }

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = (formData.get('type') as string) || 'video'

    if (!file) {
      return NextResponse.json({ error: 'No se proporciono archivo' }, { status: 400 })
    }

    const maxSize = 500 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Archivo muy grande (maximo 500MB)' },
        { status: 400 }
      )
    }

    const allowedTypes = ['video/', 'audio/', 'image/']
    if (!allowedTypes.some(function(t) { return file.type.startsWith(t) })) {
      return NextResponse.json({ error: 'Tipo de archivo no permitido' }, { status: 400 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = userId + '/' + type + '/' + Date.now() + '_' + sanitized

    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: '31536000',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      return NextResponse.json({ error: 'Error al subir archivo: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      path: data.path,
      size: file.size,
      type: file.type,
      name: file.name,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
