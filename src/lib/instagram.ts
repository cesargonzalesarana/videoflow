// =============================================
// instagram.ts - Instagram Graph API Helper
// VideoFlow - Publicación a Instagram (Reels)
// =============================================

const IG_APP_ID = process.env.META_APP_ID!
const IG_APP_SECRET = process.env.META_APP_SECRET!
const IG_API_VERSION = 'v19.0'
const IG_REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/instagram/callback`

// Solo scopes de Instagram - SIN permisos de Facebook
const IG_SCOPES = [
  'instagram_basic',
  'instagram_content_publish',
]

export function getInstagramAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: IG_APP_ID,
    redirect_uri: IG_REDIRECT_URI,
    scope: IG_SCOPES.join(','),
    response_type: 'code',
  })
  return `https://www.facebook.com/${IG_API_VERSION}/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<any> {
  const params = new URLSearchParams({
    client_id: IG_APP_ID,
    client_secret: IG_APP_SECRET,
    redirect_uri: IG_REDIRECT_URI,
    code,
  })

  const res = await fetch(
    `https://graph.facebook.com/${IG_API_VERSION}/oauth/access_token?${params.toString()}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Instagram token error: ${JSON.stringify(err)}`)
  }
  return res.json()
}

export async function refreshInstagramToken(longLivedToken: string): Promise<any> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: IG_APP_ID,
    client_secret: IG_APP_SECRET,
    fb_exchange_token: longLivedToken,
  })

  const res = await fetch(
    `https://graph.facebook.com/${IG_API_VERSION}/oauth/access_token?${params.toString()}`
  )
  if (!res.ok) throw new Error('Failed to refresh Instagram token')
  return res.json()
}

export async function getValidInstagramToken(tokenData: any): Promise<any> {
  if (!tokenData) throw new Error('No Instagram token')
  if (Date.now() < tokenData.expires_at) return tokenData

  const refreshed = await refreshInstagramToken(tokenData.access_token)
  return {
    ...tokenData,
    access_token: refreshed.access_token,
    expires_at: Date.now() + refreshed.expires_in * 1000,
  }
}

export async function getFacebookPagesForIG(accessToken: string): Promise<any[]> {
  const res = await fetch(
    `https://graph.facebook.com/${IG_API_VERSION}/me/accounts?fields=id,name,access_token&access_token=${accessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch pages for Instagram')
  const data = await res.json()
  return data.data || []
}

export async function getInstagramAccount(pageId: string, pageAccessToken: string): Promise<any> {
  const res = await fetch(
    `https://graph.facebook.com/${IG_API_VERSION}/${pageId}?fields=instagram_business_account&access_token=${pageAccessToken}`
  )
  if (!res.ok) throw new Error('Failed to fetch Instagram account')
  const data = await res.json()
  return data.instagram_business_account || null
}

export async function uploadToInstagram(
  igUserId: string,
  pageAccessToken: string,
  videoUrl: string,
  caption: string
): Promise<string> {
  // Paso 1: Crear contenedor de Reel
  const createRes = await fetch(
    `https://graph.facebook.com/${IG_API_VERSION}/${igUserId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&share_to_feed=true&access_token=${pageAccessToken}`,
    { method: 'POST' }
  )

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}))
    throw new Error(`Instagram container error: ${JSON.stringify(err)}`)
  }

  const containerData = await createRes.json()
  const containerId = containerData.id

  // Paso 2: Esperar y verificar estado del contenedor
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10000))

    const statusRes = await fetch(
      `https://graph.facebook.com/${IG_API_VERSION}/${containerId}?fields=status_code&access_token=${pageAccessToken}`
    )
    if (!statusRes.ok) continue
    const statusData = await statusRes.json()

    if (statusData.status_code === 'FINISHED') {
      // Paso 3: Publicar
      const publishRes = await fetch(
        `https://graph.facebook.com/${IG_API_VERSION}/${igUserId}/media_publish?creation_id=${containerId}&access_token=${pageAccessToken}`,
        { method: 'POST' }
      )
      if (!publishRes.ok) {
        const err = await publishRes.json().catch(() => ({}))
        throw new Error(`Instagram publish error: ${JSON.stringify(err)}`)
      }
      const publishData = await publishRes.json()
      return publishData.id
    } else if (statusData.status_code === 'ERROR') {
      throw new Error('Instagram video processing failed')
    }
  }

  throw new Error('Instagram video processing timed out')
}