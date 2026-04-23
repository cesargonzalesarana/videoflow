import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function getAuthenticatedUser(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.user) {
      return {
        success: false as const,
        response: NextResponse.json({ error: 'No autenticado' }, { status: 401 })
      }
    }

    return {
      success: true as const,
      userId: session.user.id,
      email: session.user.email,
      response: null
    }
  } catch (error) {
    console.error('Auth validation error:', error)
    return {
      success: false as const,
      response: NextResponse.json({ error: 'Error de autenticacion' }, { status: 500 })
    }
  }
}
