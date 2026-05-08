// ─── Meta Graph API Helper ──────────────────────────────────────
// Funciones para interactuar con la Meta Graph API (Facebook + Instagram)
// Requiere env vars: META_APP_ID, META_APP_SECRET

const META_GRAPH_URL = 'https://graph.facebook.com/v19.0'

// Permisos necesarios para publicar videos
const META_SCOPES = [
  'pages_manage_posts',
  'pages_read_engagement',
  'instagram_basic',
  'instagram_content_publish',
  ]

export interface MetaToken {
  access_token: string
  expires_at: number // timestamp en ms
  user_id: string
}

export interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
}

export interface InstagramAccount {
  id: string
  username: string
  name: string
}

export interface MetaVideoResult {
  id: string
  url?: string
  platform: 'facebook' | 'instagram'
  title: string
}

// ─── Generar URL de autorización OAuth de Meta ──────────────────
export function getMetaAuthUrl(redirectUri: string): string {
  const appId = process.env.META_APP_ID
  if (!appId) throw new Error('META_APP_ID no configurada')

  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_SCOPES.join(','),
    response_type: 'code',
  })

  return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
}

// ─── Intercambiar code por token de usuario ─────────────────────
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<MetaToken> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('Credenciales de Meta no configuradas')

  const response = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?` +
    new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code,
    })
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Error obteniendo token de Meta: ${err.error?.message || JSON.stringify(err)}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
    user_id: data.user_id,
  }
}

// ─── Refrescar token de usuario ─────────────────────────────────
export async function refreshMetaToken(
  userToken: string
): Promise<Partial<MetaToken>> {
  const appId = process.env.META_APP_ID
  const appSecret = process.env.META_APP_SECRET
  if (!appId || !appSecret) throw new Error('Credenciales de Meta no configuradas')

  const response = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?` +
    new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId,
      client_secret: appSecret,
      fb_exchange_token: userToken,
    })
  )

  if (!response.ok) throw new Error('Error refrescando token de Meta')

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_at: Date.now() + (data.expires_in || 5184000) * 1000, // ~60 días por defecto
  }
}

// ─── Obtener token válido ───────────────────────────────────────
export async function getValidMetaToken(token: MetaToken): Promise<string> {
  if (Date.now() < token.expires_at - 60000) {
    return token.access_token
  }

  const refreshed = await refreshMetaToken(token.access_token)
  return refreshed.access_token!
}

// ─── Obtener Páginas de Facebook del usuario ────────────────────
export async function getFacebookPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `${META_GRAPH_URL}/me/accounts?fields=id,name,access_token,category`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) throw new Error('Error obteniendo páginas de Facebook')

  const data = await response.json()
  if (!data.data || data.data.length === 0) {
    throw new Error('No se encontraron páginas de Facebook. Necesitas al menos una página.')
  }

  return data.data.map((page: any) => ({
    id: page.id,
    name: page.name,
    access_token: page.access_token,
    category: page.category,
  }))
}

// ─── Obtener cuenta de Instagram vinculada a una Página ─────────
export async function getInstagramAccount(
  pageId: string,
  pageAccessToken: string
): Promise<InstagramAccount | null> {
  const response = await fetch(
    `${META_GRAPH_URL}/${pageId}?fields=instagram_business_account{id,username,name}`,
    {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
    }
  )

  if (!response.ok) return null

  const data = await response.json()
  if (!data.instagram_business_account) return null

  const igId = data.instagram_business_account.id

  // Obtener detalles de la cuenta de Instagram
  const igResponse = await fetch(
    `${META_GRAPH_URL}/${igId}?fields=id,username,name`,
    {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
    }
  )

  if (!igResponse.ok) return null

  const igData = await igResponse.json()
  return {
    id: igData.id,
    username: igData.username,
    name: igData.name || igData.username,
  }
}

// ─── Iniciar subida de video a Facebook (paso 1: iniciar sesión) ─
export async function startFacebookVideoUpload(
  pageId: string,
  pageAccessToken: string,
  title: string
): Promise<string> {
  const response = await fetch(
    `${META_GRAPH_URL}/${pageId}/videos`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${pageAccessToken}` },
      body: new URLSearchParams({
        upload_phase: 'start',
        file_size: '0', // Se actualizará después
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Error iniciando upload a Facebook: ${err.error?.message || JSON.stringify(err)}`)
  }

  const data = await response.json()
  return data.video_id
}

// ─── Subir video a Facebook (resumable) ─────────────────────────
export async function uploadToFacebook(
  pageId: string,
  pageAccessToken: string,
  file: File | Blob,
  metadata: {
    title?: string
    description?: string
    privacy?: 'PUBLIC' | 'FRIENDS' | 'ME_ONLY'
  }
): Promise<MetaVideoResult> {
  // Usar el endpoint directo de upload
  const formData = new FormData()
  formData.append('file', file)
  if (metadata.title) formData.append('title', metadata.title)
  if (metadata.description) formData.append('description', metadata.description)
  formData.append('privacy', metadata.privacy || 'PUBLIC')

  const response = await fetch(
    `https://rupload.facebook.com/video-upload/v19.0/${pageId}/videos`,
    {
      method: 'POST',
      headers: {
        Authorization: `OAuth ${pageAccessToken}`,
        offset: '0',
        file_size: file.size.toString(),
      },
      body: file,
    }
  )

  if (!response.ok) {
    // Fallback: intentar con Graph API directo
    const fallbackResponse = await fetch(
      `${META_GRAPH_URL}/${pageId}/videos`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageAccessToken}` },
        body: new URLSearchParams({
          file_url: '', // Para uploads directos necesitamos file_url
          title: metadata.title || 'Video',
          description: metadata.description || '',
          privacy: metadata.privacy || 'PUBLIC',
        }),
      }
    )

    if (!fallbackResponse.ok) {
      const err = await fallbackResponse.json()
      throw new Error(`Error subiendo a Facebook: ${err.error?.message || JSON.stringify(err)}`)
    }

    const fallbackData = await fallbackResponse.json()
    return {
      id: fallbackData.id,
      url: `https://www.facebook.com/watch/?v=${fallbackData.id}`,
      platform: 'facebook',
      title: metadata.title || 'Video',
    }
  }

  const data = await response.json()
  return {
    id: data.id,
    url: `https://www.facebook.com/watch/?v=${data.id}`,
    platform: 'facebook',
    title: metadata.title || 'Video',
  }
}

// ─── Crear contenedor de video de Instagram (paso 1) ────────────
export async function createInstagramVideoContainer(
  igUserId: string,
  pageAccessToken: string,
  videoUrl: string,
  metadata: {
    caption?: string
  }
): Promise<string> {
  const response = await fetch(
    `${META_GRAPH_URL}/${igUserId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: 'REELS',
        video_url: videoUrl,
        caption: metadata.caption || '',
        access_token: pageAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Error creando contenedor IG: ${err.error?.message || JSON.stringify(err)}`)
  }

  const data = await response.json()
  return data.id
}

// ─── Verificar estado del contenedor de Instagram ───────────────
export async function checkInstagramContainerStatus(
  containerId: string,
  pageAccessToken: string
): Promise<string> {
  const response = await fetch(
    `${META_GRAPH_URL}/${containerId}?fields=status_code`,
    {
      headers: { Authorization: `Bearer ${pageAccessToken}` },
    }
  )

  if (!response.ok) throw new Error('Error verificando contenedor IG')

  const data = await response.json()
  return data.status_code
}

// ─── Publicar contenedor de Instagram (paso 2) ──────────────────
export async function publishInstagramContainer(
  igUserId: string,
  containerId: string,
  pageAccessToken: string
): Promise<MetaVideoResult> {
  const response = await fetch(
    `${META_GRAPH_URL}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: pageAccessToken,
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Error publicando en Instagram: ${err.error?.message || JSON.stringify(err)}`)
  }

  const data = await response.json()
  return {
    id: data.id,
    platform: 'instagram',
    title: 'Reel publicado',
  }
}