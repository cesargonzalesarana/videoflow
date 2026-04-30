import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function GET() {
  // Rate limit for session checks is more permissive

  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const userId = session.user.id
    let user = await db.user.findUnique({ where: { id: userId } })

    if (!user) {
      // Auto-create user profile from Supabase session
      user = await db.user.create({
        data: {
          id: userId,
          name: session.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          email: session.user.email || '',
          password: '__supabase_auth__'
        }
      })
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, name: user.name, email: user.email }
    })
  } catch (error) {
    console.error('Auth session check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const { success, remaining } = rateLimit(ip, 10, 60000)
  if (!success) { return NextResponse.json({ error: 'Demasiadas solicitudes. Intenta en un minuto.' }, { status: 429 }) }

  try {
    const body = await request.json()
    const { action, name, email, password } = body

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json(
          { error: 'Todos los campos son requeridos' },
          { status: 400 }
        )
      }
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseÃ±a debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }

      const supabase = await createClient()

      // Register user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      })

      if (authError) {
        console.error('Supabase auth error:', authError.message)
        return NextResponse.json(
          { error: authError.message === 'User already registered'
            ? 'Este email ya estÃ¡ registrado'
            : authError.message },
          { status: 409 }
        )
      }

      const userId = authData.user?.id
      if (!userId) {
        return NextResponse.json(
          { error: 'Error al crear la cuenta' },
          { status: 500 }
        )
      }

      // Save user profile in PostgreSQL via Prisma
      try {
        await db.user.create({
          data: {
            id: userId,
            name,
            email,
            password: '__supabase_auth__'
          }
        })
      } catch (prismaError: any) {
        // If user profile already exists, just continue
        if (!prismaError.message?.includes('Unique')) {
          console.error('Prisma create error:', prismaError)
        }
      }

      return NextResponse.json({
        user: { id: userId, name, email }
      })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email y contraseÃ±a son requeridos' },
          { status: 400 }
        )
      }

      const supabase = await createClient()

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        console.error('Supabase login error:', authError.message)
        return NextResponse.json(
          { error: 'Credenciales invÃ¡lidas' },
          { status: 401 }
        )
      }

      const userId = authData.user?.id
      if (!userId) {
        return NextResponse.json(
          { error: 'Error al iniciar sesiÃ³n' },
          { status: 500 }
        )
      }

      // Get or create user profile in PostgreSQL
      let user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        user = await db.user.create({
          data: {
            id: userId,
            name: authData.user?.user_metadata?.name || email.split('@')[0],
            email,
            password: '__supabase_auth__'
          }
        })
      }

      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email }
      })
    }

    if (action === 'session') {
      const supabase = await createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
      }

      const userId = session.user.id
      let user = await db.user.findUnique({ where: { id: userId } })

      if (!user) {
        user = await db.user.create({
          data: {
            id: userId,
            name: session.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
            email: session.user.email || '',
            password: '__supabase_auth__'
          }
        })
      }

      return NextResponse.json({
        authenticated: true,
        user: { id: user.id, name: user.name, email: user.email }
      })
    }

    return NextResponse.json({ error: 'AcciÃ³n no vÃ¡lida' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { error: 'Error del servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}
