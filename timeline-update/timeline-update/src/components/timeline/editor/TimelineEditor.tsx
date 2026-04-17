'use client'

import React, { useCallback, useEffect, useRef, useMemo } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'
import { Playhead } from './Playhead'
import { MediaPanel } from './MediaPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PreviewCanvas } from './PreviewCanvas'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useFFmpeg } from '@/hooks/use-ffmpeg'
import { useAppStore } from '@/lib/store'
import {
  ZoomIn, ZoomOut, Download, Loader2, Trash2, Film,
  ArrowLeftToLine, ArrowRightToLine, ChevronLeft, ChevronRight,
  Plus, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'

export function TimelineEditor() {
  const {
    tracks, clips, currentTime, isPlaying, zoom,
    setIsPlaying, setCurrentTime, setZoom, initializeDefaultTracks,
    clearAll, scrollX, setScrollX, getTotalDuration,
    addTrack
  } = useTimelineStore()

  const { status: ffmpegStatus, load: loadFFmpeg, writeFile, readFileAsDataURL } = useFFmpeg()
  const { isProcessing, setProcessing, setProcessingProgress, processingProgress } = useAppStore()
  const timelineContentRef = useRef<HTMLDivElement>(null)

  const totalDuration = useTimelineStore(getTotalDuration)

  // Initialize default tracks
  useEffect(() => {
    initializeDefaultTracks()
  }, [initializeDefaultTracks])

  // Playback timer
  useEffect(() => {
    let animFrame: number
    let lastTime = performance.now()

    const tick = (now: number) => {
      const delta = (now - lastTime) / 1000
      lastTime = now

      if (isPlaying) {
        const newTime = currentTime + delta
        if (newTime >= totalDuration) {
          setIsPlaying(false)
          setCurrentTime(0)
        } else {
          setCurrentTime(newTime)
        }
      }

      animFrame = requestAnimationFrame(tick)
    }

    animFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animFrame)
  }, [isPlaying, currentTime, totalDuration, setIsPlaying, setCurrentTime])

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (!timelineContentRef.current || !isPlaying) return
    const playheadX = currentTime * zoom
    const containerWidth = timelineContentRef.current.clientWidth
    if (playheadX - scrollX > containerWidth - 100) {
      setScrollX(playheadX - containerWidth + 200)
    }
  }, [currentTime, zoom, isPlaying, scrollX, setScrollX])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          setIsPlaying(!isPlaying)
          break
        case 'ArrowLeft':
          e.preventDefault()
          setCurrentTime(Math.max(0, currentTime - (e.shiftKey ? 1 : 0.1)))
          break
        case 'ArrowRight':
          e.preventDefault()
          setCurrentTime(Math.min(totalDuration, currentTime + (e.shiftKey ? 1 : 0.1)))
          break
        case 'Delete':
        case 'Backspace':
          if (useTimelineStore.getState().selectedClipId) {
            e.preventDefault()
            useTimelineStore.getState().removeClip(useTimelineStore.getState().selectedClipId!)
            toast.success('Clip eliminado')
          }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, currentTime, totalDuration, setIsPlaying, setCurrentTime])

  // Mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -10 : 10
        setZoom(zoom + delta)
      }
    },
    [zoom, setZoom]
  )

  const handleExport = async () => {
    if (clips.length === 0) {
      toast.error('Añade clips al timeline primero')
      return
    }

    const videoClips = clips.filter((c) => c.type === 'video' && c.file)
    if (videoClips.length === 0) {
      toast.error('Agrega al menos un video para exportar')
      return
    }

    setProcessing(true)
    setProcessingProgress(0)

    try {
      const ffmpeg = await loadFFmpeg()
      if (!ffmpeg) {
        toast.error('Error al cargar el motor de video')
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
            trimmedName,
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
        const concatList = fileNames.map((f) => `file '${f}'`).join('\n')
        const encoder = new TextEncoder()
        await ffmpeg.writeFile('concat.txt', encoder.encode(concatList))
        await ffmpeg.exec([
          '-f', 'concat', '-safe', '0',
          '-i', 'concat.txt',
          '-c', 'copy',
          concatenatedFile,
        ])
      }

      // Add text overlays from text clips
      setProcessingProgress(70)
      const textClips = clips.filter((c) => c.type === 'text' && c.text)
      let finalInput = concatenatedFile
      if (textClips.length > 0) {
        const firstText = textClips[0]
        const textContent = firstText.text || ''
        const escapedText = textContent.replace(/'/g, "\\'").replace(/:/g, "\\:")
        const yPos = firstText.positionY < 33
          ? 'h/10'
          : firstText.positionY > 66
          ? 'h*9/10'
          : '(h-text_h)/2'
        const fontSize = firstText.fontSize || 32

        const withText = 'with_text.mp4'
        await ffmpeg.exec([
          '-i', finalInput,
          '-vf', `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${firstText.textColor || 'white'}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@0.5:boxborderw=5`,
          '-c:a', 'copy',
          withText,
        ])
        finalInput = withText
      }

      // Apply filter if any
      const filteredClip = clips.find((c) => c.type === 'video' && c.filter && c.filter !== 'none')
      if (filteredClip && filteredClip.filter) {
        const filteredFile = 'filtered.mp4'
        const vfMap: Record<string, string> = {
          grayscale: 'hue=s=0',
          sepia: 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131',
          blur: 'boxblur=2',
          'brightness-up': 'eq=brightness=0.3',
          'contrast-up': 'eq=contrast=1.3',
        }
        const vf = vfMap[filteredClip.filter]
        if (vf) {
          setProcessingProgress(80)
          await ffmpeg.exec(['-i', finalInput, '-vf', vf, '-c:a', 'copy', filteredFile])
          finalInput = filteredFile
        }
      }

      // Final encode
      setProcessingProgress(85)
      const finalFile = 'output.mp4'
      await ffmpeg.exec([
        '-i', finalInput,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        finalFile,
      ])

      setProcessingProgress(95)
      const outputUrl = await readFileAsDataURL(ffmpeg, finalFile)

      const a = document.createElement('a')
      a.href = outputUrl
      a.download = 'videoflow_export.mp4'
      a.click()

      // Save to DB
      const user = useAppStore.getState().user
      if (user) {
        try {
          await fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              title: 'VideoFlow Export',
              status: 'completed',
              duration: totalDuration,
              resolution: '1080p',
              format: 'mp4',
            }),
          })
        } catch {
          // silent
        }
      }

      setProcessingProgress(100)
      toast.success('Video exportado correctamente!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar. Intenta con un video más corto.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#080818] select-none" onWheel={handleWheel}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Film className="h-4 w-4 text-purple-400" />
            Editor de Timeline
          </h2>
          <Badge variant="secondary" className="text-[10px] bg-white/5 text-white/40 border-white/10">
            {clips.length} clips
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <div className="flex items-center gap-0.5 mr-2 bg-white/5 rounded-md px-1 py-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(zoom - 20)}
            >
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-white/40 font-mono w-8 text-center">{zoom}px</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setZoom(zoom + 20)}
            >
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          {/* Transport controls */}
          <div className="flex items-center gap-0.5 mr-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentTime(0)}
              title="Ir al inicio"
            >
              <ArrowLeftToLine className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
              title="Retroceder 1s"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
            >
              {isPlaying ? <span className="text-xs font-bold">II</span> : <span className="text-xs font-bold ml-0.5">▶</span>}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))}
              title="Adelantar 1s"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentTime(totalDuration)}
              title="Ir al final"
            >
              <ArrowRightToLine className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Time display */}
          <span className="text-[10px] text-white/50 font-mono mr-3 min-w-[100px]">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          <div className="w-px h-5 bg-white/10" />

          {/* Export */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 ml-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs shadow-lg shadow-violet-500/20"
            onClick={handleExport}
            disabled={isProcessing || clips.length === 0 || ffmpegStatus !== 'ready'}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                {processingProgress}%
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1.5" />
                Exportar MP4
              </>
            )}
          </Button>

          {/* Clear */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-400/10"
            onClick={() => {
              clearAll()
              toast.success('Timeline limpiado')
            }}
            disabled={clips.length === 0}
            title="Limpiar todo"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Main content area: 3-column layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Media Library */}
        <div className="w-[240px] flex-shrink-0 border-r border-white/5">
          <MediaPanel />
        </div>

        {/* Center - Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview */}
          <div className="p-4 flex-shrink-0">
            <PreviewCanvas />
          </div>

          {/* Timeline area */}
          <div className="flex-1 flex flex-col border-t border-white/5 min-h-0">
            {/* Timeline toolbar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a1f] border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Timeline</span>
                <span className="text-[10px] text-white/20">
                  {tracks.length} pistas • Ctrl+Scroll para zoom
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5"
                  onClick={() => addTrack({ type: 'video', name: `Video ${tracks.filter(t => t.type === 'video').length + 1}`, muted: false, locked: false, visible: true, height: 64 })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Video
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5"
                  onClick={() => addTrack({ type: 'audio', name: `Audio ${tracks.filter(t => t.type === 'audio').length + 1}`, muted: false, locked: false, visible: true, height: 48 })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Audio
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5"
                  onClick={() => addTrack({ type: 'text', name: `Texto ${tracks.filter(t => t.type === 'text').length + 1}`, muted: false, locked: false, visible: true, height: 48 })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Texto
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5"
                  onClick={() => addTrack({ type: 'image', name: `Imagen ${tracks.filter(t => t.type === 'image').length + 1}`, muted: false, locked: false, visible: true, height: 48 })}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Imagen
                </Button>
              </div>
            </div>

            {/* Scrollable timeline tracks */}
            <ScrollArea className="flex-1">
              <div ref={timelineContentRef} className="relative min-w-full">
                {/* Ruler */}
                <div className="sticky top-0 z-10">
                  <div className="flex">
                    <div className="w-[140px] flex-shrink-0 bg-[#12122a] border-b border-white/5 border-r border-white/5" />
                    <TimelineRuler />
                  </div>
                </div>

                {/* Tracks */}
                <div className="relative">
                  {/* Playhead */}
                  <div className="sticky left-0 pointer-events-none z-20" style={{ width: `${140}px` }}>
                    {/* Spacer for playhead alignment */}
                  </div>
                  <Playhead />

                  {tracks.map((track) => (
                    <TimelineTrack key={track.id} track={track} />
                  ))}
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* Right panel - Properties */}
        <div className="w-[260px] flex-shrink-0 border-l border-white/5">
          <PropertiesPanel />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/20">
            FFmpeg: {ffmpegStatus === 'ready' ? 'Listo' : ffmpegStatus === 'loading' ? 'Cargando...' : ffmpegStatus === 'error' ? 'Error' : 'Iniciando'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/20">
            Espacio = Play/Pausa • ←→ = Navegar • Supr = Eliminar clip
          </span>
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
}
