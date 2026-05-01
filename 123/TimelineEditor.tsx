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

// === MINI ERROR BOUNDARY FOR EACH SECTION ===
class MiniBoundary extends React.Component<
  { name: string; children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[VideoFlow] CRASH in "${this.props.name}":`, error.message)
    console.error(`[VideoFlow] Component stack:`, info.componentStack)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '12px',
          margin: '4px',
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: '8px',
          color: 'rgba(248,113,113,0.7)',
          fontSize: '11px',
          fontFamily: 'monospace'
        }}>
          Error en <b>{this.props.name}</b>: {this.state.error?.message}
        </div>
      )
    }
    return this.props.children
  }
}

// Safe wrapper
function Safe({ name, children }: { name: string; children: React.ReactNode }) {
  return <MiniBoundary name={name}>{children}</MiniBoundary>
}

export function TimelineEditor() {
  // === NUCLEAR DEFENSIVE READS ===
  const tracks = (useTimelineStore((s) => s.tracks) || [])
  const clips = (useTimelineStore((s) => s.clips) || [])
  const currentTime = useTimelineStore((s) => s.currentTime) ?? 0
  const isPlaying = useTimelineStore((s) => s.isPlaying) ?? false
  const zoom = useTimelineStore((s) => s.zoom) ?? 80
  const scrollX = useTimelineStore((s) => s.scrollX) ?? 0

  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const setZoom = useTimelineStore((s) => s.setZoom)
  const initializeDefaultTracks = useTimelineStore((s) => s.initializeDefaultTracks)
  const clearAll = useTimelineStore((s) => s.clearAll)
  const setScrollX = useTimelineStore((s) => s.setScrollX)
  const addTrack = useTimelineStore((s) => s.addTrack)

  const { isProcessing, setProcessing, setProcessingProgress, processingProgress } = useAppStore()
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)

  // Safe total duration
  const totalDuration = useMemo(() => {
    try {
      if (!clips || clips.length === 0) return 30
      const maxEnd = clips.reduce((max, c) => {
        if (!c) return max
        const end = (c.startTime || 0) + (c.duration || 0)
        return Math.max(max, end)
      }, 0)
      return Math.max(30, maxEnd) + 5
    } catch { return 30 }
  }, [clips])

  useEffect(() => {
    try { initializeDefaultTracks() } catch (e) { console.error('[VideoFlow] initTracks:', e) }
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
          try {
            const selId = useTimelineStore.getState().selectedClipId
            if (selId) { e.preventDefault(); useTimelineStore.getState().removeClip(selId); toast.success('Clip eliminado') }
          } catch { }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, currentTime, totalDuration, setIsPlaying, setCurrentTime])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); setZoom(zoom + (e.deltaY > 0 ? -10 : 10)) }
    },
    [zoom, setZoom]
  )

  const handleExport = async () => {
    try {
      const { exportWithAudio } = await import('./exportWithAudio')
      await exportWithAudio(clips, audioEnabled, setProcessing, setProcessingProgress)
    } catch (e) { console.error('[VideoFlow] Export error:', e); toast.error('Error al exportar') }
  }

  // NUCLEAR: filter out null/undefined from tracks and clips
  const safeTracks = Array.isArray(tracks)
    ? tracks.filter((t): t is NonNullable<typeof t> => t != null && typeof t === 'object')
    : []

  const safeClips = Array.isArray(clips)
    ? clips.filter((c): c is NonNullable<typeof c> => c != null && typeof c === 'object')
    : []

  const videoTrackCount = safeTracks.filter((t) => t.type === 'video').length
  const audioTrackCount = safeTracks.filter((t) => t.type === 'audio').length
  const textTrackCount = safeTracks.filter((t) => t.type === 'text').length
  const imageTrackCount = safeTracks.filter((t) => t.type === 'image').length

  console.log('[VideoFlow] TimelineEditor render - tracks:', safeTracks.length, 'clips:', safeClips.length)

  return (
    <div className="h-full flex flex-col bg-[#080818] select-none" onWheel={handleWheel}>
      {/* TOP BAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <Film className="h-4 w-4 text-purple-400" />
            Editor de Timeline
          </h2>
          <Badge variant="secondary" className="text-[10px] bg-white/5 text-white/40 border-white/10">
            {safeClips.length} clips
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
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pausar' : 'Reproducir'}>
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
            variant="ghost" size="sm"
            className={'h-7 ml-2 text-xs flex items-center gap-1.5 ' + (audioEnabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/10')}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? (<><Volume2 className="h-3 w-3" />Con audio</>) : (<><VolumeX className="h-3 w-3" />Sin audio</>)}
          </Button>

          <Button variant="ghost" size="sm" className="h-7 ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs shadow-lg shadow-violet-500/20" onClick={handleExport} disabled={isProcessing || safeClips.length === 0}>
            {isProcessing ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />{processingProgress}%</>) : (<><Download className="h-3 w-3 mr-1.5" />Exportar WebM</>)}
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-400/10" onClick={() => { clearAll(); toast.success('Timeline limpiado') }} disabled={safeClips.length === 0} title="Limpiar todo">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* MAIN BODY */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Media Panel */}
        <div className="w-[240px] flex-shrink-0 border-r border-white/5">
          <Safe name="MediaPanel">
            <MediaPanel />
          </Safe>
        </div>

        {/* CENTER */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview */}
          <div className="p-4 flex-shrink-0">
            <Safe name="PreviewCanvas">
              <PreviewCanvas />
            </Safe>
          </div>

          {/* Timeline */}
          <div className="flex-1 flex flex-col border-t border-white/5 min-h-0">
            <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a1f] border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Timeline</span>
                <span className="text-[10px] text-white/20">{safeTracks.length} pistas</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'video', name: 'Video ' + (videoTrackCount + 1), muted: false, locked: false, visible: true, height: 64 })}>
                  <Plus className="h-3 w-3 mr-1" />Video
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'audio', name: 'Audio ' + (audioTrackCount + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Audio
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'text', name: 'Texto ' + (textTrackCount + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Texto
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'image', name: 'Imagen ' + (imageTrackCount + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Imagen
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div ref={timelineContentRef} className="relative min-w-full">
                <div className="sticky top-0 z-10">
                  <div className="flex">
                    <div className="w-[140px] flex-shrink-0 bg-[#12122a] border-b border-white/5 border-r border-white/5" />
                    <Safe name="TimelineRuler">
                      <TimelineRuler />
                    </Safe>
                  </div>
                </div>
                <div className="relative">
                  <div className="sticky left-0 pointer-events-none z-20" style={{ width: '140px' }} />
                  <Safe name="Playhead">
                    <Playhead />
                  </Safe>
                  <Safe name="TimelineTrack-list">
                    {safeTracks.map((track) => (
                      <TimelineTrack key={track?.id || String(Math.random())} track={track} />
                    ))}
                  </Safe>
                </div>
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>

        {/* RIGHT: Properties */}
        <div className="w-[260px] flex-shrink-0 border-l border-white/5">
          <Safe name="PropertiesPanel">
            <PropertiesPanel />
          </Safe>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <span className="text-[9px] text-white/20">Exporta en WebM | Compatible con YouTube, Instagram, TikTok, Facebook</span>
        <span className="text-[9px] text-white/20">Espacio = Play/Pausa | Flechas = Navegar | Supr = Eliminar clip</span>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds)) seconds = 0
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0') + '.' + ms
}
