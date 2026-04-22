'use client'

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
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
  Plus, Volume2, VolumeX
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
  const [exportWithAudio, setExportWithAudio] = useState(true)

  const totalDuration = useTimelineStore(getTotalDuration)

  useEffect(() => {
    initializeDefaultTracks()
  }, [initializeDefaultTracks])

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

  useEffect(() => {
    if (!timelineContentRef.current || !isPlaying) return
    const playheadX = currentTime * zoom
    const containerWidth = timelineContentRef.current.clientWidth
    if (playheadX - scrollX > containerWidth - 100) {
      setScrollX(playheadX - containerWidth + 200)
    }
  }, [currentTime, zoom, isPlaying, scrollX, setScrollX])

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

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -10 : 10
        setZoom(zoom + delta)
      }
    },
    [zoom, setZoom]
  )  const handleExport = async () => {
    if (clips.length === 0) {
      toast.error('Agrega clips al timeline primero')
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
      const audioLabel = exportWithAudio ? 'con audio' : 'sin audio'
      toast.info('Procesando video ' + audioLabel + '... Esto puede tomar unos minutos.')

      const normalizedFiles: string[] = []
      for (let i = 0; i < videoClips.length; i++) {
        const clip = videoClips[i]
        if (!clip.file) continue
        const fileName = 'clip_' + i + '.mp4'
        setProcessingProgress(Math.round(((i + 1) / videoClips.length) * 25))
        await writeFile(ffmpeg, fileName, clip.file)
        const normalizedFile = 'norm_' + i + '.mp4'
        const trimStart = clip.trimStart && clip.trimStart > 0 ? clip.trimStart : 0
        const duration = clip.trimEnd ? clip.trimEnd - trimStart : clip.duration - trimStart
        if (exportWithAudio) {
          await ffmpeg.exec([
            '-i', fileName,
            '-ss', trimStart.toString(),
            '-t', duration.toString(),
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
            '-c:a', 'copy',
            '-map', '0:v:0', '-map', '0:a?',
            '-y',
            normalizedFile,
          ])
        } else {
          await ffmpeg.exec([
            '-i', fileName,
            '-ss', trimStart.toString(),
            '-t', duration.toString(),
            '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
            '-an',
            '-y',
            normalizedFile,
          ])
        }
        normalizedFiles.push(normalizedFile)
      }

      setProcessingProgress(40)
      let concatenatedFile = normalizedFiles[0]
      if (normalizedFiles.length > 1) {
        concatenatedFile = 'concatenated.mp4'
        const concatList = normalizedFiles.map((f) => "file '" + f + "'").join('\n')
        const encoder = new TextEncoder()
        await ffmpeg.writeFile('concat.txt', encoder.encode(concatList))
        await ffmpeg.exec([
          '-f', 'concat', '-safe', '0',
          '-i', 'concat.txt',
          '-c', 'copy',
          '-y',
          concatenatedFile,
        ])
      }

      setProcessingProgress(55)
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
        if (exportWithAudio) {
          await ffmpeg.exec([
            '-i', finalInput,
            '-vf', "drawtext=text='" + escapedText + "':fontsize=" + fontSize + ":fontcolor=" + (firstText.textColor || 'white') + ":x=(w-text_w)/2:y=" + yPos + ":box=1:boxcolor=black@0.5:boxborderw=5",
            '-c:a', 'copy',
            '-y',
            withText,
          ])
        } else {
          await ffmpeg.exec([
            '-i', finalInput,
            '-vf', "drawtext=text='" + escapedText + "':fontsize=" + fontSize + ":fontcolor=" + (firstText.textColor || 'white') + ":x=(w-text_w)/2:y=" + yPos + ":box=1:boxcolor=black@0.5:boxborderw=5",
            '-an',
            '-y',
            withText,
          ])
        }
        finalInput = withText
      }

      setProcessingProgress(65)
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
          if (exportWithAudio) {
            await ffmpeg.exec(['-i', finalInput, '-vf', vf, '-c:a', 'copy', '-y', filteredFile])
          } else {
            await ffmpeg.exec(['-i', finalInput, '-vf', vf, '-an', '-y', filteredFile])
          }
          finalInput = filteredFile
        }
      }

      setProcessingProgress(80)
      const finalFile = 'output.mp4'
      if (exportWithAudio) {
        await ffmpeg.exec([
          '-i', finalInput,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-c:a', 'copy',
          '-movflags', '+faststart',
          '-y',
          finalFile,
        ])
      } else {
        await ffmpeg.exec([
          '-i', finalInput,
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '23',
          '-an',
          '-movflags', '+faststart',
          '-y',
          finalFile,
        ])
      }

      setProcessingProgress(95)
      const outputUrl = await readFileAsDataURL(ffmpeg, finalFile)
      const a = document.createElement('a')
      a.href = outputUrl
      const audioSuffix = exportWithAudio ? '' : '_sin_audio'
      a.download = 'videoflow_export' + audioSuffix + '.mp4'
      a.click()

      const user = useAppStore.getState().user
      if (user) {
        try {
          await fetch('/api/videos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: user.id,
              title: 'VideoFlow Export' + (exportWithAudio ? '' : ' (sin audio)'),
              status: 'completed',
              duration: totalDuration,
              resolution: '1080p',
              format: 'mp4',
            }),
          })
        } catch {
        }
      }

      setProcessingProgress(100)
      toast.success('Video exportado ' + audioLabel + ' correctamente!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar. Intenta con un video mas corto.')
    } finally {
      setProcessing(false)
    }
  }  return (
    <div className="h-full flex flex-col bg-[#080818] select-none" onWheel={handleWheel}>
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
          <div className="flex items-center gap-0.5 mr-2 bg-white/5 rounded-md px-1 py-0.5">
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setZoom(zoom - 20)}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-white/40 font-mono w-8 text-center">{zoom}px</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setZoom(zoom + 20)}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>

          <div className="flex items-center gap-0.5 mr-2">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(0)} title="Ir al inicio">
              <ArrowLeftToLine className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(Math.max(0, currentTime - 1))} title="Retroceder 1s">
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}>
              {isPlaying ? <span className="text-xs font-bold">II</span> : <span className="text-xs font-bold ml-0.5">&#9654;</span>}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))} title="Adelantar 1s">
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(totalDuration)} title="Ir al final">
              <ArrowRightToLine className="h-3.5 w-3.5" />
            </Button>
          </div>

          <span className="text-[10px] text-white/50 font-mono mr-3 min-w-[100px]">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>

          <div className="w-px h-5 bg-white/10" />

          <Button
            variant="ghost"
            size="sm"
            className={'h-7 ml-2 text-xs flex items-center gap-1.5 ' + (exportWithAudio ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/10')}
            onClick={() => setExportWithAudio(!exportWithAudio)}
            title={exportWithAudio ? 'Exportar con audio' : 'Exportar sin audio'}
          >
            {exportWithAudio ? (<><Volume2 className="h-3 w-3" />Con audio</>) : (<><VolumeX className="h-3 w-3" />Sin audio</>)}
          </Button>

          <Button variant="ghost" size="sm" className="h-7 ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs shadow-lg shadow-violet-500/20" onClick={handleExport} disabled={isProcessing || clips.length === 0 || ffmpegStatus !== 'ready'}>
            {isProcessing ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />{processingProgress}%</>) : (<><Download className="h-3 w-3 mr-1.5" />Exportar MP4</>)}
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-400/10" onClick={() => { clearAll(); toast.success('Timeline limpiado') }} disabled={clips.length === 0} title="Limpiar todo">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[240px] flex-shrink-0 border-r border-white/5">
          <MediaPanel />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 flex-shrink-0">
            <PreviewCanvas />
          </div>

          <div className="flex-1 flex flex-col border-t border-white/5 min-h-0">
            <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a1f] border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Timeline</span>
                <span className="text-[10px] text-white/20">{tracks.length} pistas &bull; Ctrl+Scroll para zoom</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'video', name: 'Video ' + (tracks.filter(t => t.type === 'video').length + 1), muted: false, locked: false, visible: true, height: 64 })}>
                  <Plus className="h-3 w-3 mr-1" />Video
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'audio', name: 'Audio ' + (tracks.filter(t => t.type === 'audio').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Audio
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'text', name: 'Texto ' + (tracks.filter(t => t.type === 'text').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Texto
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'image', name: 'Imagen ' + (tracks.filter(t => t.type === 'image').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Imagen
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div ref={timelineContentRef} className="relative min-w-full">
                <div className="sticky top-0 z-10">
                  <div className="flex">
                    <div className="w-[140px] flex-shrink-0 bg-[#12122a] border-b border-white/5 border-r border-white/5" />
                    <TimelineRuler />
                  </div>
                </div>
                <div className="relative">
                  <div className="sticky left-0 pointer-events-none z-20" style={{ width: '140px' }} />
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

        <div className="w-[260px] flex-shrink-0 border-l border-white/5">
          <PropertiesPanel />
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-1 border-t border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <span className="text-[9px] text-white/20">
          FFmpeg: {ffmpegStatus === 'ready' ? 'Listo' : ffmpegStatus === 'loading' ? 'Cargando...' : ffmpegStatus === 'error' ? 'Error' : 'Iniciando'}
        </span>
        <span className="text-[9px] text-white/20">
          Espacio = Play/Pausa | Flechas = Navegar | Supr = Eliminar clip
        </span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0') + '.' + ms
}