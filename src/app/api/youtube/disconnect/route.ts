import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // ─── Eliminar la cookie del token ───────────────────────────
    const response = NextResponse.json({
      success: true,
      message: 'Cuenta de YouTube desconectada correctamente',
    })

    response.cookies.set('youtube_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expirar inmediatamente
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('YouTube disconnect error:', error)
    return NextResponse.json(
      { error: 'Error al desconectar la cuenta' },
      { status: 500 }
    )
  }
}