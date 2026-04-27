import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://videoflow-theta.vercel.app/api/auth?action=reset',
    })

    if (error) {
      console.error('Reset password error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Se envio el enlace de recuperacion' })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
