import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({
      success: true,
      message: 'Cuenta de Meta desconectada correctamente',
    })

    response.cookies.set('meta_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Meta disconnect error:', error)
    return NextResponse.json(
      { error: 'Error al desconectar la cuenta' },
      { status: 500 }
    )
  }
}