import { NextRequest, NextResponse } from 'next/server'

// Mock user database for demo (uses Prisma in production)
export async function POST(request: NextRequest) {
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
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }

      // In production, hash password and store in Prisma
      const { db } = await import('@/lib/db')
      
      // Check if user exists
      const existing = await db.user.findUnique({ where: { email } })
      if (existing) {
        return NextResponse.json(
          { error: 'Este email ya está registrado' },
          { status: 409 }
        )
      }

      // Create user (in production, hash the password!)
      const user = await db.user.create({
        data: { name, email, password } // NOTE: Plain text for demo only!
      })

      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email }
      })
    }

    if (action === 'login') {
      if (!email || !password) {
        return NextResponse.json(
          { error: 'Email y contraseña son requeridos' },
          { status: 400 }
        )
      }

      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({ where: { email } })

      if (!user || user.password !== password) {
        return NextResponse.json(
          { error: 'Credenciales inválidas' },
          { status: 401 }
        )
      }

      return NextResponse.json({
        user: { id: user.id, name: user.name, email: user.email }
      })
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
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
