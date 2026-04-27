import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const userId = session.user.id
    const path = request.nextUrl.searchParams.get('path')

    if (!path) {
      return NextResponse.json({ error: 'Path no proporcionado' }, { status: 400 })
    }

    if (!path.startsWith(userId + '/')) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })
    }

    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseAdmin.storage
      .from('media')
      .createSignedUrl(path, 3600)

    if (error) {
      console.error('Signed URL error:', error)
      return NextResponse.json({ error: 'Error al generar URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (error) {
    console.error('Media URL error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
