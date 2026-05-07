// ─── YouTube API Helper ──────────────────────────────────────────
// Funciones para interactuar con la YouTube Data API v3
// Requiere env vars: YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET

const YOUTUBE_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const YOUTUBE_UPLOAD_URL = 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status'

export interface YouTubeToken {
  access_token: string
  refresh_token: string
  expires_at: number // timestamp en ms
}

export interface YouTubeVideoResult {
  id: string
  url: string
  title: string
}

// ─── Generar URL de autorización OAuth ────────────────────────────
export function getYouTubeAuthUrl(redirectUri: string): string {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  if (!clientId) throw new Error('YOUTUBE_CLIENT_ID no configurada')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: YOUTUBE_SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // Forzar para obtener refresh_token
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// ─── Intercambiar code por tokens ────────────────────────────────
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<YouTubeToken> {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Credenciales de YouTube no configuradas')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error intercambiando código: ${err}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

// ─── Refrescar token de acceso ────────────────────────────────────
export async function refreshAccessToken(
  refreshToken: string
): Promise<Partial<YouTubeToken>> {
  const clientId = process.env.YOUTUBE_CLIENT_ID
  const clientSecret = process.env.YOUTUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('Credenciales de YouTube no configuradas')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Error refrescando token: ${err}`)
  }

  const data = await response.json()
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

// ─── Obtener token válido (refrescar si es necesario) ─────────────
export async function getValidAccessToken(token: YouTubeToken): Promise<string> {
  if (Date.now() < token.expires_at - 60000) {
    return token.access_token
  }

  const refreshed = await refreshAccessToken(token.refresh_token)
  return refreshed.access_token!
}

// ─── Obtener info del canal conectado ─────────────────────────────
export async function getYouTubeChannel(accessToken: string) {
  const response = await fetch(
    'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  )

  if (!response.ok) {
    throw new Error('Error obteniendo canal de YouTube')
  }

  const data = await response.json()
  if (!data.items || data.items.length === 0) {
    throw new Error('No se encontró canal de YouTube')
  }

  return {
    id: data.items[0].id,
    title: data.items[0].snippet.title,
    thumbnail: data.items[0].snippet.thumbnails.default?.url,
  }
}

// ─── Subir video a YouTube (resumable upload) ─────────────────────
export async function uploadToYouTube(
  accessToken: string,
  file: File | Blob,
  metadata: {
    title: string
    description?: string
    tags?: string[]
    privacyStatus?: 'public' | 'unlisted' | 'private'
  }
): Promise<YouTubeVideoResult> {
  const validToken = await getValidAccessToken({ access_token: accessToken, refresh_token: '', expires_at: Date.now() + 3600000 } as YouTubeToken)
    .catch(() => accessToken)

  // Paso 1: Iniciar upload resumable
  const initResponse = await fetch(YOUTUBE_UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${validToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      snippet: {
        title: metadata.title || 'Video sin título',
        description: metadata.description || '',
        tags: metadata.tags || [],
      },
      status: {
        privacyStatus: metadata.privacyStatus || 'private',
        selfDeclaredMadeForKids: false,
      },
    }),
  })

  if (!initResponse.ok) {
    const err = await initResponse.text()
    throw new Error(`Error iniciando upload: ${err}`)
  }

  const uploadUrl = initResponse.headers.get('location')
  if (!uploadUrl) {
    throw new Error('No se recibió URL de upload')
  }

  // Paso 2: Subir el archivo
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type || 'video/mp4',
      'Content-Length': file.size.toString(),
    },
    body: file,
  })

  if (!uploadResponse.ok) {
    const err = await uploadResponse.text()
    throw new Error(`Error subiendo video: ${err}`)
  }

  const videoData = await uploadResponse.json()

  return {
    id: videoData.id,
    url: `https://www.youtube.com/watch?v=${videoData.id}`,
    title: metadata.title || 'Video sin título',
  }
}