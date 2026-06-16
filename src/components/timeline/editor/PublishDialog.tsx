'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Youtube, Instagram, Facebook, Play,
  CalendarClock, Send, Link2, Unlink,
  ChevronDown, ChevronUp, Loader2, Check,
  ExternalLink, Upload
} from 'lucide-react'

interface PublishDialogProps {
  open: boolean
  onClose: () => void
  clipCount: number
}

interface PlatformOption {
  id: string
  name: string
  icon: React.ReactNode
  color: string
}

interface YouTubeChannel {
  id: string
  title: string
  thumbnail?: string
}

interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
}

interface InstagramAccount {
  id: string
  username: string
  name: string
  pageId: string
}

interface FacebookUserInfo {
  name: string
  facebookPages: FacebookPage[]
}

interface InstagramUserInfo {
  name: string
  instagramAccount: InstagramAccount | null
}

const PLATFORMS: PlatformOption[] = [
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="h-4 w-4" />, color: 'text-red-400' },
  { id: 'tiktok', name: 'TikTok', icon: <Play className="h-4 w-4" />, color: 'text-pink-400' },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="h-4 w-4" />, color: 'text-orange-400' },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="h-4 w-4" />, color: 'text-blue-400' },
]

export function PublishDialog({ open, onClose, clipCount }: PublishDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [tags, setTags] = useState('')
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('12:00')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [isPublic, setIsPublic] = useState(false)

  // ─── YouTube states ──────────────────────────────────────────────
  const [youtubeConnected, setYoutubeConnected] = useState(false)
  const [youtubeChannel, setYoutubeChannel] = useState<YouTubeChannel | null>(null)
  const [youtubeLoading, setYoutubeLoading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadedVideos, setUploadedVideos] = useState<{ platform: string; id: string; url: string; title: string }[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Facebook states (SEPARADO de Instagram) ─────────────────────
  const [fbConnected, setFbConnected] = useState(false)
  const [fbLoading, setFbLoading] = useState(false)
  const [fbInfo, setFbInfo] = useState<FacebookUserInfo | null>(null)
  const [fbSelectedPageId, setFbSelectedPageId] = useState('')

  // ─── Instagram states (SEPARADO de Facebook) ─────────────────────
  const [igConnected, setIgConnected] = useState(false)
  const [igLoading, setIgLoading] = useState(false)
  const [igInfo, setIgInfo] = useState<InstagramUserInfo | null>(null)

  // ─── Polling refs para detectar conexion despues de OAuth ───────
  const fbPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const igPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ─── Limpiar polls al desmontar ──────────────────────────────────
  useEffect(() => {
    return () => {
      if (fbPollRef.current) clearInterval(fbPollRef.current)
      if (igPollRef.current) clearInterval(igPollRef.current)
    }
  }, [])

  // ─── Verificar estados al abrir ──────────────────────────────────
  useEffect(() => {
    if (open) {
      checkYouTubeStatus()
      checkFacebookStatus()
      checkInstagramStatus()
      checkUrlParams()
    } else {
      setUploadedVideos([])
      setUploadProgress('')
      setPublishing(false)
      if (fbPollRef.current) clearInterval(fbPollRef.current)
      if (igPollRef.current) clearInterval(igPollRef.current)
    }
  }, [open])

  const checkUrlParams = () => {
    const params = new URLSearchParams(window.location.search)
    const url = new URL(window.location.href)

    if (params.get('youtube_connected') === 'true') {
      toast.success('Cuenta de YouTube conectada exitosamente')
      url.searchParams.delete('youtube_connected')
      checkYouTubeStatus()
    }
    if (params.get('youtube_error')) {
      toast.error('Error al conectar YouTube: ' + params.get('youtube_error'))
      url.searchParams.delete('youtube_error')
    }
    if (params.get('facebook_connected') === 'true') {
      toast.success('Cuenta de Facebook conectada exitosamente')
      url.searchParams.delete('facebook_connected')
      checkFacebookStatus()
    }
    if (params.get('facebook_error')) {
      toast.error('Error al conectar Facebook: ' + params.get('facebook_error'))
      url.searchParams.delete('facebook_error')
    }
    if (params.get('instagram_connected') === 'true') {
      toast.success('Cuenta de Instagram conectada exitosamente')
      url.searchParams.delete('instagram_connected')
      checkInstagramStatus()
    }
    if (params.get('instagram_error')) {
      toast.error('Error al conectar Instagram: ' + params.get('instagram_error'))
      url.searchParams.delete('instagram_error')
    }
    window.history.replaceState({}, '', url.toString())
  }

  // ─── YouTube: verificar estado ───────────────────────────────────
  const checkYouTubeStatus = async () => {
    try {
      setYoutubeLoading(true)
      const res = await fetch('/api/youtube/auth?action=status')
      const data = await res.json()
      setYoutubeConnected(data.connected)
      setYoutubeChannel(data.connected ? data.channel : null)
    } catch {
      setYoutubeConnected(false)
      setYoutubeChannel(null)
    } finally {
      setYoutubeLoading(false)
    }
  }

  // ─── YouTube: conectar ───────────────────────────────────────────
  const handleConnectYouTube = async () => {
    try {
      setYoutubeLoading(true)
      const res = await fetch('/api/youtube/auth?action=authorize')
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank', 'width=600,height=700')
        toast.info('Autoriza tu cuenta de YouTube en la ventana que se abrio')
      }
    } catch {
      toast.error('Error al iniciar conexion con YouTube')
    } finally {
      setYoutubeLoading(false)
    }
  }

  // ─── YouTube: desconectar ────────────────────────────────────────
  const handleDisconnectYouTube = async () => {
    if (!window.confirm('Desconectar tu cuenta de YouTube?')) return
    try {
      await fetch('/api/youtube/disconnect', { method: 'POST' })
      setYoutubeConnected(false)
      setYoutubeChannel(null)
      setSelectedPlatforms((prev) => prev.filter((p) => p !== 'youtube'))
      toast.success('Cuenta de YouTube desconectada')
    } catch {
      toast.error('Error al desconectar YouTube')
    }
  }

  // ─── Facebook: verificar estado ──────────────────────────────────
  const checkFacebookStatus = async () => {
    try {
      setFbLoading(true)
      const res = await fetch('/api/facebook/auth?action=status')
      const data = await res.json()
      setFbConnected(data.connected)
      if (data.connected) {
        setFbInfo({ name: data.userName, facebookPages: data.pages || [] })
        if (data.pages?.length > 0 && !fbSelectedPageId) {
          setFbSelectedPageId(data.pages[0].id)
        }
      } else {
        setFbInfo(null)
        setFbSelectedPageId('')
      }
    } catch {
      setFbConnected(false)
      setFbInfo(null)
    } finally {
      setFbLoading(false)
    }
  }

  // ─── Facebook: conectar (con polling automatico) ─────────────────
  const handleConnectFacebook = async () => {
    try {
      setFbLoading(true)
      const res = await fetch('/api/facebook/auth?action=authorize')
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank', 'width=600,height=700')
        toast.info('Autoriza tu cuenta de Facebook en la ventana que se abrio')

        // Polling: verificar cada 3 segundos si ya se conecto
        if (fbPollRef.current) clearInterval(fbPollRef.current)
        fbPollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch('/api/facebook/auth?action=status')
            const statusData = await statusRes.json()
            if (statusData.connected) {
              if (fbPollRef.current) clearInterval(fbPollRef.current)
              setFbLoading(false)
              checkFacebookStatus()
              toast.success('Cuenta de Facebook conectada exitosamente')
            }
          } catch { /* ignorar errores de polling */ }
        }, 3000)
        setTimeout(() => { if (fbPollRef.current) clearInterval(fbPollRef.current) }, 120000)
      }
    } catch {
      toast.error('Error al iniciar conexion con Facebook')
    } finally {
      setFbLoading(false)
    }
  }

  // ─── Facebook: desconectar ───────────────────────────────────────
  const handleDisconnectFacebook = async () => {
    if (!window.confirm('Desconectar tu cuenta de Facebook?')) return
    try {
      await fetch('/api/facebook/disconnect', { method: 'POST' })
      setFbConnected(false)
      setFbInfo(null)
      setFbSelectedPageId('')
      setSelectedPlatforms((prev) => prev.filter((p) => p !== 'facebook'))
      toast.success('Cuenta de Facebook desconectada')
    } catch {
      toast.error('Error al desconectar Facebook')
    }
  }

  // ─── Instagram: verificar estado ─────────────────────────────────
  const checkInstagramStatus = async () => {
    try {
      setIgLoading(true)
      const res = await fetch('/api/instagram/auth?action=status')
      const data = await res.json()
      setIgConnected(data.connected)
      if (data.connected) {
        setIgInfo({ name: data.userName, instagramAccount: data.instagramAccount || null })
      } else {
        setIgInfo(null)
      }
    } catch {
      setIgConnected(false)
      setIgInfo(null)
    } finally {
      setIgLoading(false)
    }
  }

  // ─── Instagram: conectar (con polling automatico) ────────────────
  const handleConnectInstagram = async () => {
    try {
      setIgLoading(true)
      const res = await fetch('/api/instagram/auth?action=authorize')
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank', 'width=600,height=700')
        toast.info('Autoriza tu cuenta de Instagram en la ventana que se abrio')

        // Polling: verificar cada 3 segundos si ya se conecto
        if (igPollRef.current) clearInterval(igPollRef.current)
        igPollRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch('/api/instagram/auth?action=status')
            const statusData = await statusRes.json()
            if (statusData.connected) {
              if (igPollRef.current) clearInterval(igPollRef.current)
              setIgLoading(false)
              checkInstagramStatus()
              toast.success('Cuenta de Instagram conectada exitosamente')
            }
          } catch { /* ignorar errores de polling */ }
        }, 3000)
        setTimeout(() => { if (igPollRef.current) clearInterval(igPollRef.current) }, 120000)
      }
    } catch {
      toast.error('Error al iniciar conexion con Instagram')
    } finally {
      setIgLoading(false)
    }
  }

  // ─── Instagram: desconectar ──────────────────────────────────────
  const handleDisconnectInstagram = async () => {
    if (!window.confirm('Desconectar tu cuenta de Instagram?')) return
    try {
      await fetch('/api/instagram/disconnect', { method: 'POST' })
      setIgConnected(false)
      setIgInfo(null)
      setSelectedPlatforms((prev) => prev.filter((p) => p !== 'instagram'))
      toast.success('Cuenta de Instagram desconectada')
    } catch {
      toast.error('Error al desconectar Instagram')
    }
  }

  // ─── Seleccionar archivo de video ────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('video/')) {
      toast.error('Selecciona un archivo de video valido')
      return
    }
    if (file.size > 128 * 1024 * 1024 * 1024) {
      toast.error('El archivo excede el limite de 128GB')
      return
    }
    setSelectedFile(file)
    if (!title.trim()) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''))
    }
    toast.success(`Video seleccionado: ${(file.size / (1024 * 1024)).toFixed(1)} MB`)
  }

  if (!open) return null

  const togglePlatform = (id: string) => {
    if (id === 'youtube' && !youtubeConnected) {
      toast.info('Primero conecta tu cuenta de YouTube')
      return
    }
    if (id === 'facebook' && !fbConnected) {
      toast.info('Primero conecta tu cuenta de Facebook')
      return
    }
    if (id === 'instagram' && !igConnected) {
      toast.info('Primero conecta tu cuenta de Instagram')
      return
    }
    if (id === 'instagram' && igConnected && !igInfo?.instagramAccount) {
      toast.info('No se encontro cuenta de Instagram profesional. Necesitas una cuenta Business o Creator vinculada a una Pagina de Facebook.')
      return
    }
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Selecciona al menos una plataforma')
      return
    }
    if (!title.trim()) {
      toast.error('Escribe un titulo para la publicacion')
      return
    }

    if (mode === 'now') {
      if (!selectedFile && selectedPlatforms.some(p => p !== 'tiktok')) {
        toast.error('Selecciona un archivo de video')
        return
      }

      setPublishing(true)
      const remainingPlatforms = [...selectedPlatforms]

      // ─── Subir a YouTube ───────────────────────────────────────
      if (remainingPlatforms.includes('youtube') && selectedFile) {
        try {
          setUploadProgress('Subiendo a YouTube...')
          const formData = new FormData()
          formData.append('video', selectedFile)
          formData.append('title', title)
          formData.append('description', description)
          formData.append('tags', tags || hashtags)
          formData.append('privacy', isPublic ? 'public' : 'unlisted')

          const res = await fetch('/api/youtube/upload', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Error al subir a YouTube')

          setUploadedVideos((prev) => [...prev, { platform: 'YouTube', ...data.video }])
          toast.success(`Video subido a YouTube`)
          remainingPlatforms.splice(remainingPlatforms.indexOf('youtube'), 1)
        } catch (err: any) {
          toast.error(`YouTube: ${err.message}`)
        }
      }

      // ─── Subir a Facebook ──────────────────────────────────────
      if (remainingPlatforms.includes('facebook') && selectedFile) {
        try {
          setUploadProgress('Subiendo a Facebook...')
          const formData = new FormData()
          formData.append('video', selectedFile)
          formData.append('title', title)
          formData.append('description', description)
          formData.append('pageId', fbSelectedPageId)

          const res = await fetch('/api/facebook/upload', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Error al subir a Facebook')

          setUploadedVideos((prev) => [...prev, { platform: 'Facebook', id: data.videoId, url: data.url, title: title }])
          toast.success(`Video subido a Facebook`)
          remainingPlatforms.splice(remainingPlatforms.indexOf('facebook'), 1)
        } catch (err: any) {
          toast.error(`Facebook: ${err.message}`)
        }
      }

      // ─── Subir a Instagram ─────────────────────────────────────
      if (remainingPlatforms.includes('instagram') && selectedFile) {
        try {
          setUploadProgress('Subiendo a Instagram (puede tardar)...')
          const formData = new FormData()
          formData.append('video', selectedFile)
          formData.append('caption', description + (hashtags ? '\n' + hashtags : ''))

          const res = await fetch('/api/instagram/upload', { method: 'POST', body: formData })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error || 'Error al subir a Instagram')

          setUploadedVideos((prev) => [...prev, { platform: 'Instagram', id: data.mediaId, url: data.url, title: title }])
          toast.success(`Reel publicado en Instagram`)
          remainingPlatforms.splice(remainingPlatforms.indexOf('instagram'), 1)
        } catch (err: any) {
          toast.error(`Instagram: ${err.message}`)
        }
      }

      // ─── Plataformas restantes: simulacion ─────────────────────
      for (const platformId of remainingPlatforms) {
        await new Promise((r) => setTimeout(r, 500))
        toast.success(`Publicado en ${platformId} (pronto conexion real)`)
      }

      setUploadProgress('')
      setPublishing(false)

      if (selectedPlatforms.length === 1 && !remainingPlatforms.length) {
        setTimeout(() => onClose(), 2000)
      }
    } else {
      // ─── Programar ─────────────────────────────────────────────
      if (!scheduleDate) {
        toast.error('Selecciona una fecha')
        return
      }
      setPublishing(true)
      try {
        const scheduledAt = new Date(scheduleDate)
        const [hours, minutes] = scheduleTime.split(':')
        scheduledAt.setHours(parseInt(hours), parseInt(minutes))

        for (const platform of selectedPlatforms) {
          await fetch('/api/schedule', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoId: 'editor-export',
              platform,
              scheduledAt: scheduledAt.toISOString(),
              caption: title,
              hashtags,
            }),
          })
        }
        toast.success(`Programado en ${selectedPlatforms.length} plataforma(s) para ${format(scheduledAt, "d 'de' MMMM, HH:mm", { locale: es })}`)
        onClose()
      } catch {
        toast.error('Error al programar la publicacion')
      } finally {
        setPublishing(false)
      }
    }
  }

  // ─── Estado de cada plataforma para las tarjetas ─────────────────
  const getPlatformStatus = (platformId: string) => {
    if (platformId === 'youtube') {
      if (youtubeLoading) return { text: 'Verificando...', connected: null }
      if (youtubeConnected) return { text: youtubeChannel?.title || 'Conectada', connected: true }
      return { text: 'Conectar', connected: false }
    }
    if (platformId === 'facebook') {
      if (fbLoading) return { text: 'Verificando...', connected: null }
      if (fbConnected && fbInfo?.facebookPages?.length) return { text: fbInfo.facebookPages[0].name, connected: true }
      if (fbConnected) return { text: 'Sin pagina', connected: false }
      return { text: 'Conectar', connected: false }
    }
    if (platformId === 'instagram') {
      if (igLoading) return { text: 'Verificando...', connected: null }
      if (igConnected && igInfo?.instagramAccount) return { text: '@' + igInfo.instagramAccount.username, connected: true }
      if (igConnected) return { text: 'Sin cuenta', connected: false }
      return { text: 'Conectar', connected: false }
    }
    return { text: 'No conectada', connected: false }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0e0e24] border border-white/10 rounded-xl w-full max-w-[520px] mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div>
            <h2 className="text-lg font-semibold text-white/90 flex items-center gap-2">
              <Send className="h-5 w-5 text-purple-400" />
              Publicar Video
            </h2>
            <p className="text-xs text-white/40 mt-0.5">
              {clipCount} clip(s) en el timeline
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-white/40 hover:text-white" onClick={onClose}>
            Cerrar
          </Button>
        </div>

        <div className="p-5 space-y-5">
          {/* Platform selection */}
          <div className="space-y-2">
            <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Plataformas</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORMS.map((platform) => {
                const isSelected = selectedPlatforms.includes(platform.id)
                const status = getPlatformStatus(platform.id)

                return (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border transition-all text-left ${
                      isSelected
                        ? 'bg-white/10 border-purple-500/50 ring-1 ring-purple-500/20'
                        : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <span className={platform.color}>{platform.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isSelected ? 'text-white/90' : 'text-white/50'}`}>
                        {platform.name}
                      </p>
                      <p className="text-[10px] flex items-center gap-1 mt-0.5">
                        {status.connected === null ? (
                          <><Loader2 className="h-2.5 w-2.5 animate-spin text-white/30" /><span className="text-white/30">{status.text}</span></>
                        ) : status.connected ? (
                          <><Link2 className="h-2.5 w-2.5 text-emerald-400" /><span className="text-emerald-400 truncate">{status.text}</span></>
                        ) : (
                          <><Unlink className="h-2.5 w-2.5 text-amber-400" /><span className="text-amber-400">{status.text}</span></>
                        )}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Connect buttons - SEPARADOS */}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* YouTube */}
              {!youtubeConnected ? (
                <Button variant="ghost" size="sm" className="h-7 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20" onClick={handleConnectYouTube} disabled={youtubeLoading}>
                  {youtubeLoading ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Conectando...</> : <><Youtube className="h-3 w-3 mr-1.5" />YouTube</>}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <Link2 className="h-2.5 w-2.5" />{youtubeChannel?.title || 'YouTube'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-white/20 hover:text-red-400" onClick={handleDisconnectYouTube}>X</Button>
                </div>
              )}

              {/* Facebook - SEPARADO */}
              {!fbConnected ? (
                <Button variant="ghost" size="sm" className="h-7 text-xs bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20" onClick={handleConnectFacebook} disabled={fbLoading}>
                  {fbLoading ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Conectando...</> : <><Facebook className="h-3 w-3 mr-1.5" />Facebook</>}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <Link2 className="h-2.5 w-2.5" />{fbInfo?.name || 'Facebook'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-white/20 hover:text-red-400" onClick={handleDisconnectFacebook}>X</Button>
                </div>
              )}

              {/* Instagram - SEPARADO */}
              {!igConnected ? (
                <Button variant="ghost" size="sm" className="h-7 text-xs bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20" onClick={handleConnectInstagram} disabled={igLoading}>
                  {igLoading ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Conectando...</> : <><Instagram className="h-3 w-3 mr-1.5" />Instagram</>}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <Link2 className="h-2.5 w-2.5" />{igInfo?.instagramAccount?.username || igInfo?.name || 'Instagram'}
                  </Badge>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-white/20 hover:text-red-400" onClick={handleDisconnectInstagram}>X</Button>
                </div>
              )}
            </div>

            {/* Selector de pagina de Facebook */}
            {fbConnected && fbInfo?.facebookPages && fbInfo.facebookPages.length > 1 && (
              <div className="p-2 rounded-md bg-white/[0.03] border border-white/5">
                <Label className="text-white/30 text-[10px]">Pagina de Facebook (Plan Gratuito: 1 pagina)</Label>
                <select
                  value={fbSelectedPageId}
                  onChange={(e) => setFbSelectedPageId(e.target.value)}
                  className="w-full h-7 mt-1 rounded bg-white/5 border border-white/10 text-white text-[11px] px-2"
                >
                  {fbInfo.facebookPages.map((page) => (
                    <option key={page.id} value={page.id}>{page.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Aviso si Instagram conectado pero sin cuenta Business */}
            {igConnected && !igInfo?.instagramAccount && (
              <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] text-amber-400">
                  No se encontro cuenta de Instagram profesional. Necesitas una cuenta Business o Creator vinculada a una Pagina de Facebook.
                </p>
              </div>
            )}

            <p className="text-[10px] text-white/25">
              * Plan Gratuito: 1 cuenta por red. Plan Pro: multiples cuentas.
            </p>
          </div>

          {/* File selection */}
          {(selectedPlatforms.includes('youtube') || selectedPlatforms.includes('facebook') || selectedPlatforms.includes('instagram')) && mode === 'now' && (
            <div className="space-y-2 p-3 rounded-lg bg-purple-500/[0.05] border border-purple-500/10">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-purple-400" />
                Video para publicar
              </Label>
              {selectedFile ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-white/30">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      {selectedPlatforms.length > 1 && (
                        <span className="ml-2 text-purple-300">Se usara para: {selectedPlatforms.filter(p => p !== 'tiktok').join(', ')}</span>
                      )}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60" onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                    Cambiar
                  </Button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/5 hover:border-white/25 transition-colors">
                  <Upload className="h-4 w-4 text-white/30" />
                  <span className="text-xs text-white/40">Seleccionar archivo de video</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
            </div>
          )}

          {/* Content */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Titulo</Label>
              <Input placeholder="Titulo del video..." value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Descripcion</Label>
              <Textarea placeholder="Describe tu video..." value={description} onChange={(e) => setDescription(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 min-h-[80px]" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Hashtags</Label>
              <Input placeholder="#viral #content #video" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20" />
            </div>
          </div>

          {/* Advanced */}
          <div className="border-t border-white/5 pt-3">
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Opciones avanzadas
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Tags (separados por coma)</Label>
                  <Input placeholder="musica, entretenimiento, tutoriales" value={tags} onChange={(e) => setTags(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/15" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Categoria</Label>
                  <select className="w-full h-8 rounded-md bg-white/5 border border-white/10 text-white text-xs px-2">
                    <option value="">Seleccionar...</option>
                    <option value="entretenimiento">Entretenimiento</option>
                    <option value="musica">Musica</option>
                    <option value="educacion">Educacion</option>
                    <option value="tecnologia">Tecnologia</option>
                    <option value="gaming">Gaming</option>
                    <option value="vlogs">Vlogs</option>
                    <option value="deportes">Deportes</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="visibility" className="rounded" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                  <label htmlFor="visibility" className="text-xs text-white/40">Video publico (si no, se sube como &quot;No listado&quot; / Privado)</label>
                </div>
              </div>
            )}
          </div>

          {/* Upload progress */}
          {uploadProgress && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Loader2 className="h-4 w-4 animate-spin text-purple-400 flex-shrink-0" />
              <p className="text-xs text-purple-300">{uploadProgress}</p>
            </div>
          )}

          {/* Uploaded videos results */}
          {uploadedVideos.length > 0 && (
            <div className="space-y-2">
              {uploadedVideos.map((video, i) => (
                <div key={i} className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <p className="text-xs font-medium text-emerald-300">Subido a {video.platform}</p>
                  </div>
                  <p className="text-[10px] text-white/50">{video.title}</p>
                  {video.url && (
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300 mt-1">
                      <ExternalLink className="h-2.5 w-2.5" />Ver video
                    </a>
                  )}
                  {!video.url && video.platform === 'Instagram' && (
                    <p className="text-[10px] text-white/30 mt-1">Revisalo en tu perfil de Instagram</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Mode toggle */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setMode('now')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'now' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}`}>
                <Send className="h-3.5 w-3.5" />Publicar Ahora
              </button>
              <button onClick={() => setMode('schedule')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === 'schedule' ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'}`}>
                <CalendarClock className="h-3.5 w-3.5" />Programar
              </button>
            </div>
            {mode === 'schedule' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Fecha</Label>
                  <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Hora</Label>
                  <Input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} className="bg-white/5 border-white/10 text-white text-xs" />
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <Button onClick={handlePublish} disabled={publishing || selectedPlatforms.length === 0} className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20">
            {publishing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</>
            ) : mode === 'now' ? (
              <><Send className="h-4 w-4 mr-2" />Publicar en {selectedPlatforms.length || '...'} plataforma(s)</>
            ) : (
              <><CalendarClock className="h-4 w-4 mr-2" />Programar en {selectedPlatforms.length || '...'} plataforma(s)</>
            )}
          </Button>

          <p className="text-center text-[10px] text-white/20">
            Plan Gratuito: 4 redes, 1 cuenta por red | Plan Pro: multiples cuentas
          </p>
        </div>
      </div>
    </div>
  )
}