'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'
import { Playhead } from './Playhead'
import { MediaPanel } from './MediaPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PreviewCanvas } from './PreviewCanvas'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import {
  ZoomIn, ZoomOut, Download, Loader2, Trash2, Film,
  ArrowLeftToLine, ArrowRightToLine, ChevronLeft, ChevronRight,
  Plus, Volume2, VolumeX, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { exportWithAudio } from './exportWithAudio'

export function TimelineEditor() {
  const {
    tracks, clips, currentTime, isPlaying, zoom,
    setIsPlaying, setCurrentTime, setZoom, initializeDefaultTracks,
    clearAll, getTotalDuration, addTrack
  } = useTimelineStore()

  const { isProcessing, setProcessing, setProcessingProgress, processingProgress } = useAppStore()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const totalDuration = useTimelineStore(getTotalDuration)
  const totalWidth = totalDuration * zoom

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
    if (!scrollContainerRef.current || !isPlaying) return
    const playheadX = 140 + currentTime * zoom
    const containerWidth = scrollContainerRef.current.clientWidth
    const scrollLeft = scrollContainerRef.current.scrollLeft
    if (playheadX - scrollLeft > containerWidth - 100) {
      scrollContainerRef.current.scrollLeft = playheadX - containerWidth + 200
    }
  }, [currentTime, zoom, isPlaying])

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
    await exportWithAudio(clips, audioEnabled, setProcessing, setProcessingProgress)
  }

  const handleGoBack = () => {
    useAppStore.getState().setView('dashboard')
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#080818] select-none" onWheel={handleWheel}>
      {/* TOP TOOLBAR */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-white/50 hover:text-white hover:bg-white/10" onClick={handleGoBack} title="Volver al menu">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div className="w-px h-5 bg-white/10" />
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
            className={'h-7 ml-2 text-xs flex items-center gap-1.5 ' + (audioEnabled ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30' : 'bg-white/5 text-white/40 hover:bg-white/10 border border-white/10')}
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? 'Exportar con audio' : 'Exportar sin audio'}
          >
            {audioEnabled ? (<><Volume2 className="h-3 w-3" />Con audio</>) : (<><VolumeX className="h-3 w-3" />Sin audio</>)}
          </Button>

          <Button variant="ghost" size="sm" className="h-7 ml-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-xs shadow-lg shadow-violet-500/20" onClick={handleExport} disabled={isProcessing || clips.length === 0}>
            {isProcessing ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />{processingProgress}%</>) : (<><Download className="h-3 w-3 mr-1.5" />Exportar WebM</>)}
          </Button>

          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/30 hover:text-red-400 hover:bg-red-400/10" onClick={() => { clearAll(); toast.success('Timeline limpiado') }} disabled={clips.length === 0} title="Limpiar todo">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* MAIN AREA (3 columns) */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Media Panel */}
        <div className="w-[240px] flex-shrink-0 border-r border-white/5 overflow-hidden">
          <MediaPanel />
        </div>

        {/* CENTER: Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Preview: 44% of center height */}
          <div className="flex-shrink-0 overflow-hidden" style={{ height: '44%' }}>
            <PreviewCanvas />
          </div>

          {/* Timeline section: fills remaining space */}
          <div className="flex-1 flex flex-col border-t border-white/5 min-h-0 overflow-hidden">
            {/* Timeline sub-toolbar */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#0a0a1f] border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">Timeline</span>
                <span className="text-[10px] text-white/20">{(tracks || []).length} pistas &bull; Ctrl+Scroll para zoom</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'video', name: 'Video ' + ((tracks || []).filter(t => t.type === 'video').length + 1), muted: false, locked: false, visible: true, height: 64 })}>
                  <Plus className="h-3 w-3 mr-1" />Video
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'image', name: 'Imagen ' + ((tracks || []).filter(t => t.type === 'image').length + 1), muted: false, locked: false, visible: true, height: 56 })}>
                  <Plus className="h-3 w-3 mr-1" />Imagen
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'text', name: 'Texto ' + ((tracks || []).filter(t => t.type === 'text').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Texto
                </Button>
                <Button variant="ghost" size="sm" className="h-6 text-[10px] text-white/30 hover:text-white/60 hover:bg-white/5" onClick={() => addTrack({ type: 'audio', name: 'Audio ' + ((tracks || []).filter(t => t.type === 'audio').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                  <Plus className="h-3 w-3 mr-1" />Audio
                </Button>
              </div>
            </div>

            {/* TIMELINE SCROLL CONTAINER */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-auto"
              data-timeline-scroll="true"
            >
              <div className="relative" style={{ minWidth: totalWidth + 140 }}>
                {/* Ruler row: sticky top */}
                <div className="flex sticky top-0 z-10" style={{ height: 28 }}>
                  <div className="w-[140px] flex-shrink-0 sticky left-0 z-20 bg-[#12122a] border-b border-white/5 border-r border-white/5 flex items-center px-3">
                    <span className="text-[9px] text-white/30 uppercase tracking-wider">Pistas</span>
                  </div>
                  <div className="flex-1 bg-[#1a1a2e] border-b border-white/5 cursor-pointer relative overflow-hidden">
                    <TimelineRuler />
                  </div>
                </div>

                {/* Track rows */}
                {(tracks || []).map((track) => (
                  <TimelineTrack key={track.id}