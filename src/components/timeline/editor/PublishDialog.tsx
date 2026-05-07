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
  ExternalLink, AlertCircle, Upload
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
  const [uploadProgress, setUploadProgress] = useState<string>('')
  const [uploadedVideo, setUploadedVideo] = useState<{ id: string; url: string; title: string } | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ─── Verificar estado de YouTube al abrir ────────────────────────
  useEffect(() => {
    if (open) {
      checkYouTubeStatus()
      // Detectar youtube_connected de la URL
      const params = new URLSearchParams(window.location.search)
      if (params.get('youtube_connected') === 'true') {
        toast.success('Cuenta de YouTube conectada exitosamente')
        // Limpiar param de la URL sin recargar
        const url = new URL(window.location.href)
        url.searchParams.delete('youtube_connected')
        window.history.replaceState({}, '', url.toString())
        checkYouTubeStatus()
      }
      if (params.get('youtube_error')) {
        toast.error('Error al conectar YouTube: ' + params.get('youtube_error'))
        const url = new URL(window.location.href)
        url.searchParams.delete('youtube_error')
        window.history.replaceState({}, '', url.toString())
      }
    } else {
      // Reset al cerrar
      setUploadedVideo(null)
      setUploadProgress('')
      setPublishing(false)
    }
  }, [open])

  const checkYouTubeStatus = async () => {
    try {
      setYoutubeLoading(true)
      const res = await fetch('/api/youtube/auth?action=status')
      const data = await res.json()
      setYoutubeConnected(data.connected)
      if (data.connected && data.channel) {
        setYoutubeChannel(data.channel)
      } else {
        setYoutubeChannel(null)
      }
    } catch {
      setYoutubeConnected(false)
      setYoutubeChannel(null)
    } finally {
      setYoutubeLoading(false)
    }
  }

  // ─── Conectar YouTube ────────────────────────────────────────────
  const handleConnectYouTube = async () => {
    try {
      setYoutubeLoading(true)
      const res = await fetch('/api/youtube/auth?action=authorize')
      const data = await res.json()
      if (data.url) {
        // Abrir en nueva pestaña
        window.open(data.url, '_blank', 'width=600,height=700')
        toast.info('Autoriza tu cuenta de YouTube en la ventana que se abrio')
      }
    } catch {
      toast.error('Error al iniciar conexion con YouTube')
    } finally {
      setYoutubeLoading(false)
    }
  }

  // ─── Desconectar YouTube ─────────────────────────────────────────
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

  // ─── Seleccionar archivo de video ────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar que sea video
    if (!file.type.startsWith('video/')) {
      toast.error('Selecciona un archivo de video valido')
      return
    }

    // Validar tamano (max 128GB)
    if (file.size > 128 * 1024 * 1024 * 1024) {
      toast.error('El archivo excede el limite de 128GB')
      return
    }

    setSelectedFile(file)
    // Auto-llenar titulo si esta vacio
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

    // ─── YouTube: subir video real ────────────────────────────────
    if (mode === 'now' && selectedPlatforms.includes('youtube')) {
      if (!selectedFile) {
        toast.error('Selecciona un archivo de video para subir a YouTube')
        return
      }

      setPublishing(true)
      setUploadProgress('Preparando video...')
      setUploadedVideo(null)

      try {
        const formData = new FormData()
        formData.append('video', selectedFile)
        formData.append('title', title)
        formData.append('description', description)
        formData.append('tags', tags || hashtags)
        formData.append('privacy', isPublic ? 'public' : 'unlisted')

        setUploadProgress('Subiendo a YouTube... (puede tardar segun el tamano del video)')

        const res = await fetch('/api/youtube/upload', {
          method: 'POST',
          body: formData,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Error al subir el video')
        }

        setUploadedVideo(data.video)
        setUploadProgress('')
        toast.success(`Video subido a YouTube: ${data.video.title}`)

        // Remover YouTube de la lista de pendientes
        setSelectedPlatforms((prev) => prev.filter((p) => p !== 'youtube'))

        // Si solo era YouTube, cerrar
        if (selectedPlatforms.length === 1) {
          setTimeout(() => onClose(), 2000)
        }
      } catch (err: any) {
        setUploadProgress('')
        toast.error(err.message || 'Error al subir a YouTube')
      } finally {
        setPublishing(false)
      }
      return
    }

    // ─── Otras plataformas: simulacion visual ─────────────────────
    if (mode === 'now') {
      setPublishing(true)
      await new Promise((r) => setTimeout(r, 1500))
      setPublishing(false)
      toast.success(`Publicado en ${selectedPlatforms.length} plataforma(s). Pronto se conectara con las redes.`)
      onClose()
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
                const isYouTube = platform.id === 'youtube'

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
                        {isYouTube ? (
                          youtubeLoading ? (
                            <><Loader2 className="h-2.5 w-2.5 animate-spin text-white/30" /><span className="text-white/30">Verificando...</span></>
                          ) : youtubeConnected ? (
                            <><Link2 className="h-2.5 w-2.5 text-emerald-400" /><span className="text-emerald-400">{youtubeChannel?.title || 'Conectada'}</span></>
                          ) : (
                            <><Unlink className="h-2.5 w-2.5 text-amber-400" /><span className="text-amber-400">Conectar</span></>
                          ) 
                        ) : (
                          <><Unlink className="h-2.5 w-2.5 text-white/25" /><span className="text-white/25">No conectada</span></>
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

            {/* YouTube connect/disconnect buttons */}
            <div className="flex items-center gap-2 mt-2">
              {!youtubeConnected ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                  onClick={handleConnectYouTube}
                  disabled={youtubeLoading}
                >
                  {youtubeLoading ? (
                    <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />Conectando...</>
                  ) : (
                    <><Youtube className="h-3 w-3 mr-1.5" />Conectar YouTube</>
                  )}
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 gap-1">
                    <Link2 className="h-2.5 w-2.5" />
                    {youtubeChannel?.title || 'YouTube conectado'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-white/25 hover:text-red-400 hover:bg-red-400/10"
                    onClick={handleDisconnectYouTube}
                  >
                    Desconectar
                  </Button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-white/25">
              * Conecta tus cuentas para publicar directamente. TikTok, Instagram y Facebook pronto.
            </p>
          </div>

          {/* File selection for YouTube */}
          {selectedPlatforms.includes('youtube') && mode === 'now' && (
            <div className="space-y-2 p-3 rounded-lg bg-red-500/[0.05] border border-red-500/10">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-red-400" />
                Video para YouTube
              </Label>
              {selectedFile ? (
                <div className="flex items-center gap-2 p-2 rounded-md bg-white/5 border border-white/10">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/80 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-white/30">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-white/30 hover:text-white/60"
                    onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-md border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/5 hover:border-white/25 transition-colors"
                >
                  <Upload className="h-4 w-4 text-white/30" />
                  <span className="text-xs text-white/40">Seleccionar archivo de video</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <p className="text-[10px] text-white/20">
                Selecciona el video exportado (WebM, MP4, MOV, etc.) o cualquier video de tu computadora
              </p>
            </div>
          )}

          {/* Content */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Titulo</Label>
              <Input
                placeholder="Titulo del video..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Descripcion</Label>
              <Textarea
                placeholder="Describe tu video..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20 min-h-[80px]"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-white/60 text-xs uppercase tracking-wider font-medium">Hashtags</Label>
              <Input
                placeholder="#viral #content #video"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-sm placeholder:text-white/20"
              />
            </div>
          </div>

          {/* Advanced */}
          <div className="border-t border-white/5 pt-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
            >
              {showAdvanced ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              Opciones avanzadas
            </button>
            {showAdvanced && (
              <div className="mt-3 space-y-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Tags para YouTube (separados por coma)</Label>
                  <Input
                    placeholder="musica, entretenimiento, tutoriales"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs placeholder:text-white/15"
                  />
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
                  <input
                    type="checkbox"
                    id="visibility"
                    className="rounded"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label htmlFor="visibility" className="text-xs text-white/40">
                    Video publico (si no, se sube como &quot;No listado&quot;)
                  </label>
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

          {/* Uploaded video result */}
          {uploadedVideo && (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-emerald-400" />
                <p className="text-sm font-medium text-emerald-300">Video subido exitosamente</p>
              </div>
              <p className="text-xs text-white/60 mb-2">{uploadedVideo.title}</p>
              <a
                href={uploadedVideo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Ver en YouTube
              </a>
            </div>
          )}

          {/* Mode toggle */}
          <div className="border-t border-white/5 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMode('now')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'now'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                <Send className="h-3.5 w-3.5" />
                Publicar Ahora
              </button>
              <button
                onClick={() => setMode('schedule')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'schedule'
                    ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-lg shadow-purple-500/20'
                    : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                }`}
              >
                <CalendarClock className="h-3.5 w-3.5" />
                Programar
              </button>
            </div>

            {mode === 'schedule' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Fecha</Label>
                  <Input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-white/40 text-xs">Hora</Label>
                  <Input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="bg-white/5 border-white/10 text-white text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action button */}
          <Button
            onClick={handlePublish}
            disabled={publishing || selectedPlatforms.length === 0}
            className="w-full h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-sm font-medium shadow-lg shadow-purple-500/20"
          >
            {publishing ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando...</>
            ) : mode === 'now' ? (
              <><Send className="h-4 w-4 mr-2" />Publicar en {selectedPlatforms.length || '...'} plataforma(s)</>
            ) : (
              <><CalendarClock className="h-4 w-4 mr-2" />Programar en {selectedPlatforms.length || '...'} plataforma(s)</>
            )}
          </Button>

          <p className="text-center text-[10px] text-white/20">
            Plan Gratuito: 4 redes | Plan Pro: redes ilimitadas + multicuentas
          </p>
        </div>
      </div>
    </div>
  )
}