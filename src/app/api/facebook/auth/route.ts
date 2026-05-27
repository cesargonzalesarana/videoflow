import { NextRequest, NextResponse } from 'next/server'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '3268486610028771'
const FACEBOOK_CONFIG_ID = process.env.FACEBOOK_CONFIG_ID || '1290513316582933'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || ''

export async function GET(request: NextRequest) {
  const token = request.cookies.get('facebook_access_token')?.value
  const userInfoRaw = request.cookies.get('facebook_user_info')?.value

  // If already connected, return status (for fetch checks)
  if (token && userInfoRaw) {
    try {
      const userInfo = JSON.parse(decodeURIComponent(userInfoRaw))
      return NextResponse.json({
        connected: true,
        userName: userInfo.name || '',
        pageName: userInfo.pageName || '',
      })
    } catch {
      // Cookie exists but is corrupted, continue to re-auth
    }
  }

  // If request expects JSON (fetch/AJAX call), return not-connected
  const accept = request.headers.get('accept') || ''
  if (accept.includes('application/json')) {
    return NextResponse.json({ connected: false })
  }

  // Otherwise redirect to Facebook OAuth (browser navigation)
  const redirectUri = `${APP_URL}/api/facebook/callback`
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${FACEBOOK_CONFIG_ID}&scope=instagram_basic,pages_show_list,pages_manage_posts,instagram_content_publish`

  return NextResponse.redirect(authUrl)
}