// =============================================
// facebook.ts - Facebook Pages API Helper
// VideoFlow - Publicación a Facebook
// =============================================

const FB_APP_ID = process.env.META_APP_ID!
const FB_APP_SECRET = process.env.META_APP_SECRET!
const FB_API_VERSION = 'v19.0'
const FB_REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/facebook/callback`

// Solo scopes de Facebook - SIN permisos de Instagram
const FB_SCOPES = [
  'public_profile',
  'email',
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
]

export function getFacebookAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    redirect_uri: FB_REDIRECT_URI,
    scope: FB_SCOPES.join(','),
    response_type: 'code',
  })
  return `https://www.facebook.com/${FB_API_VERSION}/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<any> {
  const params = new URLSearchParams({
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    redirect_uri: FB_REDIRECT_URI,
    code,
  })

  const res = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?${params.toString()}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Facebook token error: ${JSON.stringify(err)}`)
  }
  return res.json()
}

export async function refreshFacebookToken(longLivedToken: string): Promise<any> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: FB_APP_ID,
    client_secret: FB_APP_SECRET,
    fb_exchange_token: longLivedToken,
  })

  const res = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token?${params.toString()}`
  )
  if (!res.ok) throw new Error('Failed to refresh Facebook token')
  return res.json()
}

export async function getValidFacebookToken(tokenData: any): Promise<any> {
  if (!tokenData) throw new Error('No Facebook token')
  if (Date.now() < tokenData.expires_at) return tokenData

  const refreshed = await refreshFacebookToken(tokenData.access_token)
  return {
    ...tokenData,
    access_token: refreshed.access_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
  }
}

export async function getFacebookPages(accessToken: string): Promise<any[]> {
  const res = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/me/accounts?fields=id,name,access_token,picture{url}&access_token=${accessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch Facebook pages')
  const data = await res.json()
  return data.data || []
}

export async function uploadToFacebook(
  pageAccessToken: string,
  pageId: string,
  videoBuffer: Buffer,
  title: string,
  description: string
): Promise<any> {
  const formData = new FormData()
  formData.append('file', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4')
  formData.append('title', title)
  formData.append('description', description)

  const res = await fetch(
    `https://graph.facebook.com/${FB_API_VERSION}/${pageId}/videos?access_token=${pageAccessToken}`,
    {
      method: 'POST',
      body: formData,
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Facebook upload error: ${JSON.stringify(err)}`)
  }
  return res.json()
}