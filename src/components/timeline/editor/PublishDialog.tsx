'use client'

import { useState } from 'react'
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
  ChevronDown, ChevronUp, Loader2, Check
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
  connected: boolean
}

const PLATFORMS: PlatformOption[] = [
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="h-4 w-4" />, color: 'text-red-400', connected: false },
  { id: 'tiktok', name: 'TikTok', icon: <Play className="h-4 w-4" />, color: 'text-pink-400', connected: false },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="h-4 w-4" />, color: 'text-orange-400', connected: false },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="h-4 w-4" />, color: 'text-blue-400', connected: false },
]

export function PublishDialog({ open, onClose, clipCount }: PublishDialogProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('12:00')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [publishing, setPublishing] = useState(false)

  if (!open) return null

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      toast.error('Selecciona al menos una plataforma')
      return
    }
    if (mode === 'now' && !title.trim()) {
      toast.error('Escribe un titulo para la publicacion')
      return
    }

    if (mode === 'now') {
      setPublishing(true)
      // Simulamos la publicacion - Fase 1 es solo visual
      await new Promise((r) => setTimeout(r, 1500))
      setPublishing(false)
      toast.success(`Publicado en ${selectedPlatforms.length} plataforma(s). Pronto se conectara con las redes.`)
      onClose()
    } else {
      if (!scheduleDate) {
        toast.error('Selecciona una fecha')
        return
      }

      setPublishing(true)
      try {
        const scheduledAt = new Date(scheduleDate)
        const [hours, minutes] = scheduleTime.split(':')
        scheduledAt.setHours(parseInt(hours), parseInt(minutes))

        // Usamos la API existente de schedule
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
                        {platform.connected ? (
                          <><Link2 className="h-2.5 w-2.5 text-emerald-400" /><span className="text-emerald-400">Conectada</span></>
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
            <p className="text-[10px] text-white/25">
              * Conecta tus cuentas en la seccion de Configuracion
            </p>
          </div>

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
                  <Label className="text-white/40 text-xs">Tags (separados por coma)</Label>
                  <Input
                    placeholder="musica, entretenimiento, tutoriales"
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
                  <input type="checkbox" id="visibility" className="rounded" />
                  <label htmlFor="visibility" className="text-xs text-white/40">Video publico</label>
                </div>
              </div>
            )}
          </div>

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