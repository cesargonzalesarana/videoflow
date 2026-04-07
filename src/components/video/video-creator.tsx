'use client'

import { useState, useRef, useCallback } from 'react'
import { useAppStore, type TimelineClip } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Play, Pause, SkipBack, SkipForward, Volume2,
  Type, Image as ImageIcon, Music, Film, Plus, Trash2, GripVertical,
  Layers, Download, Loader2, Sparkles, Wand2, Copy
} from 'lucide-react'
import { toast } from 'sonner'

const clipColors: Record<string, string> = {
  video: 'from-purple-500 to-purple-600',
  image: 'from-fuchsia-500 to-fuchsia-600',
  audio: 'from-green-500 to-green-600',
  text: 'from-amber-500 to-amber-600',
}

const clipIcons: Record<string, React.ReactNode> = {
  video: <Film className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  audio: <Music className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
}

const templates = [
  { id: '1', name: 'Intro Dinámica', duration: 5, type: 'text', description: 'Animación de texto con título' },
  { id: '2', name: 'Transición Swipe', duration: 2, type: 'video', description: 'Transición tipo swipe' },
  { id: '3', name: 'Subtítulo Cinematic', duration: 3, type: 'text', description: 'Subtítulos estilo película' },
  { id: '4', name: 'Outro con CTA', duration: 4, type: 'text', description: 'Llamada a la acción final' },
  { id: '5', name: 'Countdown Timer', duration: 5, type: 'text', description: 'Cuenta regresiva animada' },
  { id: '6', name: 'Lower Third', duration: 3, type: 'text', description: 'Barra de información inferior' },
]

export function VideoCreator() {
  const {
    timelineClips, addTimelineClip, removeTimelineClip, updateTimelineClip,
    clearTimeline, isProcessing, processingProgress, setProcessing, setProcessingProgress
  } = useAppStore()

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isDragOver, setIsDragOver] = useState(false)
  const [textOverlay, setTextOverlay] = useState('')
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'center' | 'bottom'>('center')
  const [showTextPanel, setShowTextPanel] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const totalDuration = timelineClips.reduce((sum, clip) => sum + clip.duration, 0)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    files.forEach((file) => {
      const type = file.type.startsWith('video') ? 'video'
        : file.type.startsWith('image') ? 'image'
        : file.type.startsWith('audio') ? 'audio'
        : null

      if (type) {
        addTimelineClip({
          id: Math.random().toString(36).substr(2, 9),
          type: type as TimelineClip['type'],
          name: file.name,
          duration: type === 'image' ? 3 : type === 'text' ? 3 : 5,
          startTime: timelineClips.length > 0
            ? timelineClips[timelineClips.length - 1].startTime + timelineClips[timelineClips.length - 1].duration
            : 0,
          file,
        })
        toast.success(`${file.name} añadido al timeline`)
      }
    })
  }, [timelineClips, addTimelineClip])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach((file) => {
      const type = file.type.startsWith('video') ? 'video'
        : file.type.startsWith('image') ? 'image'
        : file.type.startsWith('audio') ? 'audio'
        : null

      if (type) {
        addTimelineClip({
          id: Math.random().toString(36).substr(2, 9),
          type: type as TimelineClip['type'],
          name: file.name,
          duration: type === 'image' ? 3 : 5,
          startTime: timelineClips.length > 0
            ? timelineClips[timelineClips.length - 1].startTime + timelineClips[timelineClips.length - 1].duration
            : 0,
          file,
        })
      }
    })
  }

  const addTextOverlay = () => {
    if (!textOverlay.trim()) return
    addTimelineClip({
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      name: `Texto: ${textOverlay.substring(0, 20)}...`,
      duration: 3,
      startTime: timelineClips.length > 0
        ? timelineClips[timelineClips.length - 1].startTime + timelineClips[timelineClips.length - 1].duration
        : 0,
      color: 'amber',
    })
    setTextOverlay('')
    setShowTextPanel(false)
    toast.success('Overlay de texto añadido')
  }

  const addTemplate = (template: typeof templates[0]) => {
    addTimelineClip({
      id: Math.random().toString(36).substr(2, 9),
      type: template.type as TimelineClip['type'],
      name: template.name,
      duration: template.duration,
      startTime: timelineClips.length > 0
        ? timelineClips[timelineClips.length - 1].startTime + timelineClips[timelineClips.length - 1].duration
        : 0,
    })
    toast.success(`Template "${template.name}" añadido`)
  }

  const handleExport = async () => {
    if (timelineClips.length === 0) {
      toast.error('Añade clips al timeline primero')
      return
    }
    if (!videoTitle.trim()) {
      toast.error('Introduce un título para el video')
      return
    }

    setProcessing(true)
    setProcessingProgress(0)

    // Simulated processing
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((r) => setTimeout(r, 80))
      setProcessingProgress(i)
    }

    // Save video record
    const { user } = useAppStore.getState()
    if (user) {
      try {
        await fetch('/api/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            title: videoTitle,
            status: 'completed',
            duration: totalDuration,
            resolution: '1080p',
            format: 'mp4',
          }),
        })
      } catch {
        // Silently fail for demo
      }
    }

    setProcessing(false)
    toast.success('¡Video exportado correctamente!')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold">Crear Video</h1>
          <p className="text-muted-foreground text-sm">Arrastra archivos o usa templates para empezar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={clearTimeline} disabled={timelineClips.length === 0} size="sm">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Limpiar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isProcessing || timelineClips.length === 0}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20"
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            {isProcessing ? `Exportando ${processingProgress}%` : 'Exportar'}
          </Button>
        </div>
      </motion.div>

      {/* Video Title */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Input
          placeholder="Título del video..."
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          className="bg-background/50 border-border/50 focus:border-purple-500/50 text-lg font-medium h-12"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Preview Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 space-y-4"
        >
          {/* Preview Player */}
          <Card className="glass border-border/30 overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-purple-950/50 to-black rounded-t-lg flex items-center justify-center">
              {/* Drop zone overlay */}
              <AnimatePresence>
                {isDragOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-20 bg-purple-500/10 border-2 border-dashed border-purple-400 flex items-center justify-center"
                  >
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                      <p className="text-purple-300 font-medium">Soltar archivos aquí</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Preview content */}
              {timelineClips.length === 0 ? (
                <div
                  className="text-center p-8 cursor-pointer"
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-purple-500/30">
                    <Upload className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium mb-1">Arrastra tus archivos aquí</p>
                  <p className="text-sm text-muted-foreground">
                    Videos, imágenes o audio • MP4, JPG, PNG, MP3
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 border-purple-500/30 text-purple-400 hover:text-purple-300">
                    Seleccionar Archivos
                  </Button>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Preview simulation */}
                  <div className="text-center">
                    {timelineClips.map((clip) => (
                      <div key={clip.id} className="mb-2">
                        {clip.type === 'text' ? (
                          <p className="text-2xl font-bold text-white drop-shadow-lg">
                            {clip.name.replace('Texto: ', '')}
                          </p>
                        ) : (
                          <div className="w-16 h-12 rounded bg-muted/20 flex items-center justify-center mx-auto">
                            {clipIcons[clip.type]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,image/*,audio/*"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>

            {/* Controls */}
            <div className="p-4 space-y-3">
              {/* Progress bar */}
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full"
                  style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white hover:from-purple-500 hover:to-fuchsia-500"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">
                    {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                    {' / '}
                    {Math.floor(totalDuration / 60).toString().padStart(2, '0')}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[volume]}
                    onValueChange={(v) => setVolume(v[0])}
                    max={100}
                    step={1}
                    className="w-24"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Timeline */}
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  Timeline
                  <Badge variant="secondary" className="text-xs">{timelineClips.length} clips</Badge>
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {timelineClips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Añade clips para ver el timeline</p>
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-2 min-w-max pb-2">
                    {timelineClips.map((clip) => (
                      <motion.div
                        key={clip.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`timeline-clip flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${clipColors[clip.type]} text-white cursor-grab min-w-[100px]`}
                        style={{ width: `${Math.max(100, clip.duration * 40)}px` }}
                      >
                        <GripVertical className="h-3.5 w-3.5 opacity-60" />
                        {clipIcons[clip.type]}
                        <span className="text-xs font-medium truncate flex-1">{clip.name}</span>
                        <span className="text-xs opacity-70">{clip.duration}s</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 hover:bg-white/20"
                          onClick={() => removeTimelineClip(clip.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {/* Add clip buttons */}
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border/30">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="border-purple-500/30 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Archivo
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowTextPanel(!showTextPanel)} className="border-amber-500/30 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10">
                  <Type className="mr-1.5 h-3.5 w-3.5" />
                  Texto
                </Button>
              </div>

              {/* Text overlay panel */}
              <AnimatePresence>
                {showTextPanel && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/30">
                      <Textarea
                        placeholder="Escribe tu texto overlay..."
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        className="min-h-[60px] bg-background/50 border-border/50"
                      />
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Posición:</Label>
                        {(['top', 'center', 'bottom'] as const).map((pos) => (
                          <Button
                            key={pos}
                            variant={overlayPosition === pos ? 'default' : 'outline'}
                            size="sm"
                            className={overlayPosition === pos ? 'bg-purple-600 text-white h-7 text-xs' : 'h-7 text-xs'}
                            onClick={() => setOverlayPosition(pos)}
                          >
                            {pos === 'top' ? 'Arriba' : pos === 'center' ? 'Centro' : 'Abajo'}
                          </Button>
                        ))}
                        <Button size="sm" onClick={addTextOverlay} className="ml-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white h-7 text-xs">
                          <Plus className="mr-1 h-3 w-3" />
                          Añadir
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right Sidebar - Templates */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-fuchsia-400" />
                Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-[500px]">
                <div className="divide-y divide-border/30">
                  {templates.map((template, i) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => addTemplate(template)}
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${clipColors[template.type]} flex items-center justify-center flex-shrink-0`}>
                        <Wand2 className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{template.name}</p>
                        <p className="text-xs text-muted-foreground">{template.description}</p>
                      </div>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
