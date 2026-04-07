'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore, type TimelineClip } from '@/lib/store'
import { useFFmpeg } from '@/hooks/use-ffmpeg'
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
  Layers, Download, Loader2, Sparkles, Wand2, Copy, RotateCcw, Check, Video
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

interface ClipWithPreview extends TimelineClip {
  previewUrl?: string
  trimStart?: number
  trimEnd?: number
}

export function VideoCreator() {
  const {
    timelineClips, addTimelineClip, removeTimelineClip, updateTimelineClip,
    clearTimeline, isProcessing, processingProgress, setProcessing, setProcessingProgress
  } = useAppStore()

  const { status: ffmpegStatus, progress: ffmpegProgress, message: ffmpegMessage, load: loadFFmpeg, writeFile, readFileAsDataURL, addTextOverlay, concatVideos, exportVideo } = useFFmpeg()

  const [clips, setClips] = useState<ClipWithPreview[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(80)
  const [isDragOver, setIsDragOver] = useState(false)
  const [textOverlay, setTextOverlay] = useState('')
  const [overlayPosition, setOverlayPosition] = useState<'top' | 'center' | 'bottom'>('center')
  const [showTextPanel, setShowTextPanel] = useState(false)
  const [videoTitle, setVideoTitle] = useState('')
  const [activeClipId, setActiveClipId] = useState<string | null>(null)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoPreviewRef = useRef<HTMLVideoElement>(null)

  const totalDuration = clips.reduce((sum, clip) => {
    const trimDuration = clip.trimEnd && clip.trimStart
      ? clip.trimEnd - clip.trimStart
      : clip.duration
    return sum + trimDuration
  }, 0)

  useEffect(() => {
    if (clips.length === 0 && timelineClips.length > 0) {
      setClips(timelineClips as ClipWithPreview[])
    }
  }, [])

  useEffect(() => {
    loadFFmpeg()
  }, [loadFFmpeg])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying && totalDuration > 0) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.1
        })
      }, 100)
    }
    return () => clearInterval(interval)
  }, [isPlaying, totalDuration])

  useEffect(() => {
    if (videoPreviewRef.current) {
      if (isPlaying) {
        videoPreviewRef.current.play().catch(() => {})
      } else {
        videoPreviewRef.current.pause()
      }
    }
  }, [isPlaying])

  const getActiveClipAtTime = (time: number) => {
    let accumulated = 0
    for (const clip of clips) {
      const clipDuration = clip.trimEnd && clip.trimStart
        ? clip.trimEnd - clip.trimStart
        : clip.duration
      if (time >= accumulated && time < accumulated + clipDuration) {
        return { clip, clipTime: time - accumulated }
      }
      accumulated += clipDuration
    }
    return null
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    processFiles(Array.from(e.dataTransfer.files))
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(e.target.files || []))
  }

  const processFiles = (files: File[]) => {
    files.forEach((file) => {
      const type = file.type.startsWith('video') ? 'video'
        : file.type.startsWith('image') ? 'image'
        : file.type.startsWith('audio') ? 'audio'
        : null
      if (!type) return

      const previewUrl = URL.createObjectURL(file)
      const clipId = Math.random().toString(36).substr(2, 9)
      const startTime = clips.length > 0
        ? clips.reduce((sum, c) => sum + (c.trimEnd && c.trimStart ? c.trimEnd - c.trimStart : c.duration), 0)
        : 0

      const newClip: ClipWithPreview = {
        id: clipId,
        type: type as TimelineClip['type'],
        name: file.name,
        duration: type === 'image' ? 3 : type === 'text' ? 3 : 5,
        startTime,
        file,
        previewUrl,
      }

      if (type === 'video') {
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
          newClip.duration = Math.round(video.duration * 10) / 10
          newClip.trimEnd = newClip.duration
          setClips(prev => prev.map(c => c.id === clipId ? newClip : c))
        }
        video.src = previewUrl
      }

      setClips(prev => [...prev, newClip])
      addTimelineClip(newClip)
      setSelectedClipId(clipId)
      toast.success(`${file.name} añadido al timeline`)
    })
  }

  const addTextClip = () => {
    if (!textOverlay.trim()) return
    const clipId = Math.random().toString(36).substr(2, 9)
    const startTime = clips.length > 0
      ? clips.reduce((sum, c) => sum + (c.trimEnd && c.trimStart ? c.trimEnd - c.trimStart : c.duration), 0)
      : 0

    const newClip: ClipWithPreview = {
      id: clipId,
      type: 'text',
      name: `Texto: ${textOverlay.substring(0, 20)}...`,
      duration: 3,
      startTime,
      color: 'amber',
    }

    setClips(prev => [...prev, newClip])
    addTimelineClip(newClip)
    setTextOverlay('')
    setShowTextPanel(false)
    toast.success('Overlay de texto añadido')
  }

  const addTemplate = (template: typeof templates[0]) => {
    const clipId = Math.random().toString(36).substr(2, 9)
    const startTime = clips.length > 0
      ? clips.reduce((sum, c) => sum + (c.trimEnd && c.trimStart ? c.trimEnd - c.trimStart : c.duration), 0)
      : 0

    const newClip: ClipWithPreview = {
      id: clipId,
      type: template.type as TimelineClip['type'],
      name: template.name,
      duration: template.duration,
      startTime,
    }

    setClips(prev => [...prev, newClip])
    addTimelineClip(newClip)
    toast.success(`Template "${template.name}" añadido`)
  }

  const handleExport = async () => {
    if (clips.length === 0) {
      toast.error('Añade clips al timeline primero')
      return
    }
    if (!videoTitle.trim()) {
      toast.error('Introduce un título para el video')
      return
    }

    const videoClips = clips.filter(c => c.file && c.type === 'video')
    if (videoClips.length === 0) {
      toast.error('Agrega al menos un video para exportar')
      return
    }

    setProcessing(true)
    setProcessingProgress(0)

    try {
      const ffmpeg = await loadFFmpeg()
      if (!ffmpeg) {
        toast.error('Error al cargar el motor de video. Recarga la página.')
        setProcessing(false)
        return
      }

      toast.info('Procesando video... Esto puede tomar unos minutos.')

      const fileNames: string[] = []
      for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i]
        if (!clip.file) continue
        const fileName = `clip_${i}.mp4`
        setProcessingProgress(Math.round(((i + 1) / videoClips.length) * 30))
        await writeFile(ffmpeg, fileName, clip.file)

        if (clip.trimStart && clip.trimStart > 0) {
          const trimmedName = `trimmed_${i}.mp4`
          const duration = clip.trimEnd ? clip.trimEnd - clip.trimStart : clip.duration - clip.trimStart
          await ffmpeg.exec([
            '-ss', clip.trimStart.toString(),
            '-i', fileName,
            '-t', duration.toString(),
            '-c', 'copy',
            trimmedName
          ])
          fileNames.push(trimmedName)
        } else {
          fileNames.push(fileName)
        }
      }

      setProcessingProgress(50)
      let concatenatedFile = fileNames[0]
      if (fileNames.length > 1) {
        concatenatedFile = 'concatenated.mp4'
        const concatList = fileNames.map(f => `file '${f}'`).join('\n')
        const encoder = new TextEncoder()
        await ffmpeg.writeFile('concat.txt', encoder.encode(concatList))
        await ffmpeg.exec([
          '-f', 'concat', '-safe', '0',
          '-i', 'concat.txt',
          '-c', 'copy',
          concatenatedFile
        ])
      }

      setProcessingProgress(70)
      const textClips = clips.filter(c => c.type === 'text')
      let finalInput = concatenatedFile
      if (textClips.length > 0 && textClips[0].name) {
        const textContent = textClips[0].name.replace('Texto: ', '')
        const withText = 'with_text.mp4'
        const escapedText = textContent.replace(/'/g, "\\'").replace(/:/g, "\\:")
        const yPos = overlayPosition === 'top' ? 'h/10' : overlayPosition === 'bottom' ? 'h*9/10' : '(h-text_h)/2'

        await ffmpeg.exec([
          '-i', finalInput,
          '-vf', `drawtext=text='${escapedText}':fontsize=28:fontcolor=white:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@0.5:boxborderw=5`,
          '-c:a', 'copy',
          withText
        ])
        finalInput = withText
      }

      setProcessingProgress(80)
      const finalFile = 'output.mp4'
      await ffmpeg.exec([
        '-i', finalInput,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        finalFile
      ])

      setProcessingProgress(95)
      const outputUrl = await readFileAsDataURL(ffmpeg, finalFile)

      const a = document.createElement('a')
      a.href = outputUrl
      a.download = `${videoTitle.replace(/\s+/g, '_')}.mp4`
      a.click()

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
        } catch {}
      }

      setProcessingProgress(100)
      toast.success('¡Video exportado correctamente! Se está descargando...')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar. Intenta con un video más corto.')
    } finally {
      setProcessing(false)
    }
  }

  const removeClip = (clipId: string) => {
    setClips(prev => {
      const clip = prev.find(c => c.id === clipId)
      if (clip?.previewUrl) URL.revokeObjectURL(clip.previewUrl)
      return prev.filter(c => c.id !== clipId)
    })
    removeTimelineClip(clipId)
  }

  const clearAll = () => {
    clips.forEach(c => {
      if (c.previewUrl) URL.revokeObjectURL(c.previewUrl)
    })
    setClips([])
    clearTimeline()
    setCurrentTime(0)
    setIsPlaying(false)
  }

  const activeClipInfo = getActiveClipAtTime(currentTime)
  const activeClip = clips.length > 0 ? clips[0] : activeClipInfo?.clip


  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold">Crear Video</h1>
          <p className="text-muted-foreground text-sm">Sube videos, agrega texto y exporta tu creación</p>
        </div>
        <div className="flex items-center gap-2">
          {ffmpegStatus !== 'idle' && ffmpegStatus !== 'ready' && (
            <Badge variant="outline" className="text-xs">
              {ffmpegStatus === 'loading' && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
              {ffmpegStatus === 'loading' ? 'Cargando FFmpeg...' : ffmpegStatus === 'error' ? 'Error FFmpeg' : `${ffmpegProgress}%`}
            </Badge>
          )}
          <Button variant="outline" onClick={clearAll} disabled={clips.length === 0 || isProcessing} size="sm">
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Limpiar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isProcessing || clips.length === 0 || ffmpegStatus !== 'ready'}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20"
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="mr-2 h-3.5 w-3.5" />
            )}
            {isProcessing ? `Exportando ${processingProgress}%` : ffmpegStatus !== 'ready' ? 'Cargando...' : 'Exportar MP4'}
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <Input
          placeholder="Título del video..."
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          className="bg-background/50 border-border/50 focus:border-purple-500/50 text-lg font-medium h-12"
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-3 space-y-4"
        >
          <Card className="glass border-border/30 overflow-hidden">
            <div
              className="relative aspect-video bg-gradient-to-br from-purple-950/50 to-black rounded-t-lg flex items-center justify-center overflow-hidden"
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
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

              {clips.length === 0 ? (
                <div
                  className="text-center p-8 cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-20 h-20 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border-2 border-dashed border-purple-500/30">
                    <Video className="h-8 w-8 text-purple-400" />
                  </div>
                  <p className="text-lg font-medium mb-1">Arrastra tus videos aquí</p>
                  <p className="text-sm text-muted-foreground">
                    Videos, imágenes o audio • MP4, MOV, JPG, PNG, MP3
                  </p>
                  <Button variant="outline" size="sm" className="mt-4 border-purple-500/30 text-purple-400 hover:text-purple-300">
                    Seleccionar Archivos
                  </Button>
                </div>
              ) : activeClip?.previewUrl && activeClip.type === 'video' ? (
                <video
                  ref={videoPreviewRef}
                  src={activeClip.previewUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  loop
                  muted={volume === 0}
                  playsInline
                />
              ) : activeClip?.type === 'text' ? (
                <div className="text-center p-8">
                  <p className="text-3xl font-bold text-white drop-shadow-lg">
                    {activeClip.name.replace('Texto: ', '')}
                  </p>
                </div>
              ) : activeClip?.type === 'image' && activeClip.previewUrl ? (
                <img src={activeClip.previewUrl} alt={activeClip.name} className="absolute inset-0 w-full h-full object-contain" />
              ) : (
                <div className="text-center p-8">
                  <Film className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-muted-foreground">Selecciona un clip para ver preview</p>
                </div>
              )}

              <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" className="hidden" onChange={handleFileInput} />
            </div>

            <div className="p-4 space-y-3">
              <div
                className="relative h-1.5 bg-muted rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect()
                  const x = e.clientX - rect.left
                  const pct = x / rect.width
                  setCurrentTime(pct * totalDuration)
                }}
              >
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
                  <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="w-24" />
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="h-4 w-4 text-purple-400" />
                  Timeline
                  <Badge variant="secondary" className="text-xs">{clips.length} clips</Badge>
                </CardTitle>
                <span className="text-xs text-muted-foreground font-mono">
                  Duración total: {Math.floor(totalDuration / 60)}:{Math.floor(totalDuration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {clips.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Añade clips para ver el timeline</p>
                </div>
              ) : (
                <ScrollArea className="w-full">
                  <div className="flex items-center gap-2 min-w-max pb-2">
                    {clips.map((clip) => {
                      const clipDuration = clip.trimEnd && clip.trimStart ? clip.trimEnd - clip.trimStart : clip.duration
                      return (
                        <motion.div
                          key={clip.id}
                          layout
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={`timeline-clip flex flex-col rounded-lg bg-gradient-to-r ${clipColors[clip.type]} text-white cursor-pointer min-w-[100px] overflow-hidden ${activeClipId === clip.id ? 'ring-2 ring-white/60' : ''}`}
                          style={{ width: `${Math.max(100, clipDuration * 40)}px` }}
                          onClick={() => setActiveClipId(clip.id === activeClipId ? null : clip.id)}
                        >
                          <div className="flex items-center gap-2 px-3 py-2">
                            <GripVertical className="h-3.5 w-3.5 opacity-60 flex-shrink-0" />
                            {clipIcons[clip.type]}
                            <span className="text-xs font-medium truncate flex-1">{clip.name}</span>
                            <span className="text-xs opacity-70">{clipDuration.toFixed(1)}s</span>
                            <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/20 flex-shrink-0" onClick={(e) => { e.stopPropagation(); removeClip(clip.id) }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>

                          {activeClipId === clip.id && clip.type === 'video' && (
                            <div className="px-3 py-2 bg-black/20 space-y-2">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs text-white/80">Inicio:</Label>
                                <Input
                                  type="number"
                                  value={clip.trimStart || 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0
                                    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, trimStart: val } : c))
                                  }}
                                  className="h-6 text-xs bg-black/30 border-white/20 text-white w-16"
                                  min={0}
                                  max={clip.duration}
                                  step={0.1}
                                />
                                <Label className="text-xs text-white/80">Fin:</Label>
                                <Input
                                  type="number"
                                  value={clip.trimEnd || clip.duration}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || clip.duration
                                    setClips(prev => prev.map(c => c.id === clip.id ? { ...c, trimEnd: Math.min(val, clip.duration) } : c))
                                  }}
                                  className="h-6 text-xs bg-black/30 border-white/20 text-white w-16"
                                  min={0}
                                  max={clip.duration}
                                  step={0.1}
                                />
                                <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-white/20 text-white" onClick={(e) => {
                                  e.stopPropagation()
                                  setClips(prev => prev.map(c => c.id === clip.id ? { ...c, trimStart: 0, trimEnd: c.duration } : c))
                                }}>
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </div>
                              <p className="text-[10px] text-white/60">
                                Duración recortada: {((clip.trimEnd || clip.duration) - (clip.trimStart || 0)).toFixed(1)}s
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>
                </ScrollArea>
              )}

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
                        <Button size="sm" onClick={addTextClip} className="ml-auto bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white h-7 text-xs">
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

          <Card className="glass border-border/30 mt-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                {ffmpegStatus === 'ready' ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : ffmpegStatus === 'loading' ? (
                  <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                ) : ffmpegStatus === 'error' ? (
                  <Trash2 className="h-4 w-4 text-red-400" />
                ) : (
                  <Film className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-medium">Motor de Video</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {ffmpegStatus === 'ready' ? 'Listo para exportar' :
                 ffmpegStatus === 'loading' ? 'Cargando FFmpeg...' :
                 ffmpegStatus === 'error' ? 'Error - Recarga la página' :
                 'Iniciando...'}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}