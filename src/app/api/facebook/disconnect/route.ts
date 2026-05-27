import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ disconnected: true })
  response.cookies.set('facebook_access_token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  response.cookies.set('facebook_user_info', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return response
}