import { NextRequest, NextResponse } from 'next/server'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '3268486610028771'
const FACEBOOK_CONFIG_ID = process.env.FACEBOOK_CONFIG_ID || '1290513316582933'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://videoflow-theta.vercel.app'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // ─── Verificar estado de conexion ─────────────────────────
  if (action === 'status') {
    const token = request.cookies.get('instagram_access_token')?.value
    const businessId = request.cookies.get('instagram_business_id')?.value

    if (token && businessId) {
      try {
        // Verificar que el token sigue siendo valido
        const verifyUrl = `https://graph.facebook.com/v21.0/${businessId}?fields=username,name,ig_id&access_token=${token}`
        const verifyRes = await fetch(verifyUrl)
        if (verifyRes.ok) {
          const accountData = await verifyRes.json()
          return NextResponse.json({
            connected: true,
            userName: accountData.name || '',
            instagramAccount: {
              id: accountData.ig_id || businessId,
              username: accountData.username || '',
              name: accountData.name || '',
              pageId: businessId,
            },
          })
        }
        // Token expirado
        return NextResponse.json({ connected: false })
      } catch {
        // Error de red, reportar como conectado basado en cookies
        return NextResponse.json({
          connected: true,
          instagramAccount: { id: businessId, username: '', name: '', pageId: businessId },
        })
      }
    }
    return NextResponse.json({ connected: false })
  }

  // ─── Retornar URL de autorizacion (para popup) ────────────
  if (action === 'authorize') {
    const redirectUri = `${APP_URL}/api/instagram/callback`
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${FACEBOOK_CONFIG_ID}&scope=instagram_basic,pages_show_list,pages_manage_posts,instagram_content_publish`
    return NextResponse.json({ url: authUrl })
  }

  // ─── Default: redirigir a OAuth (navegacion directa) ──────
  const redirectUri = `${APP_URL}/api/instagram/callback`
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&config_id=${FACEBOOK_CONFIG_ID}&scope=instagram_basic,pages_show_list,pages_manage_posts,instagram_content_publish`
  return NextResponse.redirect(authUrl)
}