import { NextRequest, NextResponse } from 'next/server'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '3268486610028771'
const FACEBOOK_CONFIG_ID = process.env.FACEBOOK_CONFIG_ID || '1290513316582933'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

export async function GET(request: NextRequest) {
  const token = request.cookies.get('instagram_access_token')?.value
  const businessId = request.cookies.get('instagram_business_id')?.value

  // If already connected, return status (for fetch checks)
  if (token && businessId) {
    try {
      // Optionally verify the token is still valid
      const verifyUrl = `https://graph.facebook.com/v21.0/me?access_token=${token}&fields=id,name`
      const verifyRes = await fetch(verifyUrl)
      if (verifyRes.ok) {
        return NextResponse.json({
          connected: true,
          businessId: businessId,
        })
      }
      // Token expired, treat as disconnected
    } catch {
      // Network error, still report connected based on cookie
      return NextResponse.json({
        connected: true,
        businessId: businessId,
      })
    }
  }

  // If request expects JSON (fetch/AJAX call), return not-connected
  const accept = request.headers.get('accept') || ''
  if (accept.includes('application/json')) {
    return NextResponse.json({ connected: false })
  }

  // Otherwise redirect to Facebook OAuth for Instagram permissions (browser navigation)
  const redirectUri = `${APP_URL}/api/instagram/callback`
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${FACEBOOK_CONFIG_ID}&scope=instagram_basic,pages_show_list,pages_manage_posts,instagram_content_publish`

  return NextResponse.redirect(authUrl)
}