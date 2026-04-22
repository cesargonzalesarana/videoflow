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
  )

  const handleExport = async () => {
    const videoClips = clips.filter((c) => c.type === 'video' && c.file)
    if (videoClips.length === 0) {
      toast.error('Agrega al menos un video para exportar')
      return
    }
    setProcessing(true)
    setProcessingProgress(0)
    try {
      const clip = videoClips[0]
      const objectUrl = URL.createObjectURL(clip.file!)
      const canvas = document.createElement('canvas')
      canvas.width = 1280
      canvas.height = 720
      const ctx = canvas.getContext('2d')!
      const video = document.createElement('video')
      video.src = objectUrl
      video.playsInline = true
      video.preload = 'auto'

      setProcessingProgress(5)
      await new Promise<void>((resolve, reject) => {
        video.oncanplaythrough = () => resolve()
        video.onerror = () => reject(new Error('No se pudo cargar el video'))
        video.load()
      })

      setProcessingProgress(10)

      let audioCtx: AudioContext | null = null
      let audioDest: MediaStreamAudioDestinationNode | null = null
      if (exportWithAudio) {
        try {
          audioCtx = new AudioContext()
          if (audioCtx.state === 'suspended') await audioCtx.resume()
          const source = audioCtx.createMediaElementSource(video)
          audioDest = audioCtx.createMediaStreamDestination()
          source.connect(audioDest)
        } catch (e) {
          console.warn('Audio no disponible, exportando sin audio')
        }
      }

      const textClips = clips.filter((c) => c.type === 'text' && c.text)
      const imageClips = clips.filter((c) => c.type === 'image' && c.previewUrl)
      const loadedImages: { clip: typeof imageClips[0]; img: HTMLImageElement }[] = []
      for (const ic of imageClips) {
        try {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.src = ic.previewUrl!
          await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() })
          loadedImages.push({ clip: ic, img })
        } catch { /* skip */ }
      }

      setProcessingProgress(15)
      const canvasStream = canvas.captureStream(30)
      const streamTracks = [...canvasStream.getVideoTracks()]
      if (exportWithAudio && audioDest) {
        streamTracks.push(...audioDest.stream.getAudioTracks())
      }
      const combinedStream = new MediaStream(streamTracks)

      let mimeType = 'video/webm;codecs=vp9,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'

      const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 5000000 })
      const chunks: Blob[] = []
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'videoflow_export' + (exportWithAudio ? '' : '_sin_audio') + '.webm'
        a.click()
        URL.revokeObjectURL(url)
        URL.revokeObjectURL(objectUrl)
      }

      recorder.start(200)
      setProcessingProgress(20)

      const trimStart = clip.trimStart || 0
      const exportDuration = clip.duration
      video.currentTime = trimStart
      await video.play()
      setProcessingProgress(25)

      const renderFrame = () => {
        if (video.paused || video.ended || video.currentTime >= trimStart + exportDuration) {
          video.pause()
          if (recorder.state !== 'inactive') recorder.stop()
          if (audioCtx) audioCtx.close()
          setProcessingProgress(100)
          toast.success('Video exportado ' + (exportWithAudio ? 'con' : 'sin') + ' audio!')
          setProcessing(false)
          return
        }
        ctx.fillStyle = '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        if (video.readyState >= 2) {
          const vw = video.videoWidth || canvas.width
          const vh = video.videoHeight || canvas.height
          const scale = Math.min(canvas.width / vw, canvas.height / vh)
          const dw = vw * scale
          const dh = vh * scale
          ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
        }

        const t = video.currentTime
        loadedImages.forEach(({ clip: ic, img }) => {
          if (t >= ic.startTime && t < ic.startTime + ic.duration) {
            const s = (ic.scale || 100) / 100
            const iw = img.naturalWidth * s * (canvas.height / img.naturalHeight)
            const ih = canvas.height * s
            ctx.globalAlpha = (ic.opacity || 100) / 100
            ctx.drawImage(img, ((ic.positionX || 50) / 100) * canvas.width - iw / 2, ((ic.positionY || 50) / 100) * canvas.height - ih / 2, iw, ih)
            ctx.globalAlpha = 1
          }
        })

        textClips.filter((c) => c.text && t >= c.startTime && t < c.startTime + c.duration).forEach((tc) => {
          const fs = ((tc.fontSize || 32) / 720) * canvas.height
          ctx.font = 'bold ' + fs + 'px system-ui, sans-serif'
          ctx.fillStyle = tc.textColor || '#ffffff'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.shadowColor = 'rgba(0,0,0,0.8)'
          ctx.shadowBlur = 8
          ctx.fillText(tc.text || '', ((tc.positionX || 50) / 100) * canvas.width, ((tc.positionY || 50) / 100) * canvas.height)
          ctx.shadowBlur = 0
          ctx.shadowColor = 'transparent'
        })

        const elapsed = video.currentTime - trimStart
        setProcessingProgress(Math.min(95, Math.round(25 + (elapsed / exportDuration) * 70)))
        requestAnimationFrame(renderFrame)
      }
      requestAnimationFrame(renderFrame)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Error al exportar. Intenta de nuevo.')
      setProcessing(false)
    }
  }
  
  return (
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

          <Button variant="ghost" size="sm" className="h-7 ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs shadow-lg shadow-violet-500/20" onClick={handleExport} disabled={isProcessing || clips.length === 0}>
            {isProcessing ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />{processingProgress}%</>) : (<><Download className="h-3 w-3 mr-1.5" />Exportar WebM</>)}
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
          Exporta en WebM | Compatible con YouTube, Instagram, TikTok, Facebook
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