import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Dynamic imports to prevent build crash if packages fail
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const userId = session.user.id

    // Try to get user from DB, but don't fail if DB is down
    let name = session.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario'
    let email = session.user.email || ''

    try {
      const { db } = await import('@/lib/db')
      let user = await db.user.findUnique({ where: { id: userId } })
      if (!user) {
        user = await db.user.create({
          data: {
            id: userId,
            name,
            email,
            password: '__supabase_auth__'
          }
        })
      }
      name = user.name
      email = user.email
    } catch (dbError) {
      console.error('DB error in auth GET (non-critical):', dbError)
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: userId, name, email }
    })
  } catch (error) {
    console.error('Auth session check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 200 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, name, email, password } = body

    if (action === 'register') {
      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
      }
      if (password.length < 6) {
        return NextResponse.json({ error: 'La contrasena debe tener al menos 6 caracteres' }, { status: 400 })
      }

      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
      })

      if (authError) {
        return NextResponse.json(
          { error: authError.message === 'User already registered' ? 'Este email ya esta registrado' : authError.message },
          { status: 409 }
        )
      }

      const userId = authData.user?.id
      if (!userId) {
        return NextResponse.json({ error: 'Error al crear la cuenta' }, { status: 500 })
      }

      // Try to save to DB, but don't fail if DB is down
      try {
        const { db } = await import('@/lib/db')
        await db.user.create({
          data: { id: userId, name, email, password: '__supabase_auth__' }
        })
      } catch (dbError: any) {
        if (!dbError.message?.includes('Unique')) {
          console.error('Prisma create error (non-critical):', dbError)
        }
      }

      return NextResponse.json({ user: { id: userId, name, email } })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email y contrasena son requeridos' }, { status: 400 })
      }

      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        return NextResponse.json({ error: 'Credenciales invalidas' }, { status: 401 })
      }

      const userId = authData.user?.id
      if (!userId) {
        return NextResponse.json({ error: 'Error al iniciar sesion' }, { status: 500 })
      }

      // Try to get/create user from DB, but don't fail if DB is down
      let name = authData.user?.user_metadata?.name || email.split('@')[0] || 'Usuario'
      let userEmail = email

      try {
        const { db } = await import('@/lib/db')
        let user = await db.user.findUnique({ where: { id: userId } })
        if (!user) {
          user = await db.user.create({
            data: { id: userId, name, email, password: '__supabase_auth__' }
          })
        }
        name = user.name
        userEmail = user.email
      } catch (dbError) {
        console.error('DB error in login (non-critical):', dbError)
      }

      return NextResponse.json({ user: { id: userId, name, email: userEmail } })
    }

    if (action === 'session') {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session?.user) {
        return NextResponse.json({ authenticated: false }, { status: 401 })
      }

      const userId = session.user.id
      let name = session.user?.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario'
      let userEmail = session.user.email || ''

      try {
        const { db } = await import('@/lib/db')
        let user = await db.user.findUnique({ where: { id: userId } })
        if (!user) {
          user = await db.user.create({
            data: { id: userId, name, email: userEmail, password: '__supabase_auth__' }
          })
        }
        name = user.name
        userEmail = user.email
      } catch (dbError) {
        console.error('DB error in session (non-critical):', dbError)
      }

      return NextResponse.json({
        authenticated: true,
        user: { id: userId, name, email: userEmail }
      })
    }

    return NextResponse.json({ error: 'Accion no valida' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE() {
  return NextResponse.json({ success: true })
}