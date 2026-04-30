'use client'

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'
import { Playhead } from './Playhead'
import { PropertiesPanel } from './PropertiesPanel'
import { PreviewCanvas } from './PreviewCanvas'
import { ToolSidebar, ToolType } from './ToolSidebar'
import { ToolPanel } from './ToolPanel'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import {
  ZoomIn, ZoomOut, Download, Loader2, Trash2, Film,
  ArrowLeftToLine, ArrowRightToLine, ChevronLeft, ChevronRight,
  Plus, Volume2, VolumeX, Undo2, Redo2, Save, LayoutGrid,
  Settings, ChevronDown
} from 'lucide-react'
import { toast } from 'sonner'
import { exportWithAudio } from './exportWithAudio'

export function TimelineEditor() {
  const {
    tracks, clips, currentTime, isPlaying, zoom,
    setIsPlaying, setCurrentTime, setZoom, initializeDefaultTracks,
    clearAll, scrollX, setScrollX, getTotalDuration,
    addTrack, undo, redo, canUndo, canRedo
  } = useTimelineStore()

  const { isProcessing, setProcessing, setProcessingProgress, processingProgress } = useAppStore()
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [activeTool, setActiveTool] = useState<ToolType>('media')
  const [showProjectMenu, setShowProjectMenu] = useState(false)

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
        case 'Digit1': setActiveTool('media'); break
        case 'Digit2': setActiveTool('text'); break
        case 'Digit3': setActiveTool('audio'); break
        case 'Digit4': setActiveTool('videos'); break
        case 'Digit5': setActiveTool('images'); break
        case 'Digit6': setActiveTool('tts'); break
        case 'Digit7': setActiveTool('record'); break
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
        case 'KeyZ':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            if (e.shiftKey) redo()
            else undo()
          }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, currentTime, totalDuration, setIsPlaying, setCurrentTime, undo, redo])

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

  return (
    <div className="h-full flex flex-col bg-[#080818] select-none" onWheel={handleWheel}>
      {/* ===== TOP BAR ===== */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 bg-[#0a0a1f] flex-shrink-0">
        {/* Left: Logo + Project */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Film className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">VideoFlow</h1>
              <p className="text-[9px] text-white/30 leading-none mt-0.5">Editor de Video</p>
            </div>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Project name */}
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
            >
              <span className="text-xs text-white/60">Mi Proyecto</span>
              <ChevronDown className="h-3 w-3 text-white/30" />
            </button>
          </div>
        </div>

        {/* Center: Undo/Redo + Actions */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-1 bg-white/3 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-20"
              onClick={() => undo()}
              disabled={!canUndo}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/30 hover:text-white/70 hover:bg-white/5 disabled:opacity-20"
              onClick={() => redo()}
              disabled={!canRedo}
              title="Rehacer (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="w-px h-5 bg-white/5" />

          <Button
            variant="ghost"
            size="sm"
            className={'h-7 ml-1 text-[11px] flex items-center gap-1.5 ' + (audioEnabled ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20' : 'bg-white/3 text-white/40 hover:bg-white/5 border border-white/5')}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled ? (<><Volume2 className="h-3 w-3" />Audio ON</>) : (<><VolumeX className="h-3 w-3" />Audio OFF</>)}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 ml-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[11px] shadow-lg shadow-blue-500/20 font-medium px-3"
            onClick={handleExport}
            disabled={isProcessing || clips.length === 0}
          >
            {isProcessing
              ? (<><Loader2 className="h-3 w-3 mr-1.5 animate-spin" />{processingProgress}%</>)
              : (<><Download className="h-3 w-3 mr-1.5" />Exportar WebM</>)
            }
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white/20 hover:text-red-400 hover:bg-red-400/10 ml-0.5"
            onClick={() => { clearAll(); toast.success('Timeline limpiado') }}
            disabled={clips.length === 0}
            title="Limpiar todo"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Tool Sidebar */}
        <ToolSidebar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* LEFT PANEL: Tool Content */}
        <div className="w-[220px] flex-shrink-0 border-r border-white/5">
          <ToolPanel activeTool={activeTool} />
        </div>

        {/* CENTER: Preview + Timeline */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Preview area */}
          <div className="flex-1 flex items-center justify-center p-3 min-h-0 bg-[#060612]">
            <div className="w-full max-w-2xl">
              <PreviewCanvas />
            </div>
          </div>

          {/* Timeline section */}
          <div className="flex flex-col border-t border-white/5" style={{ height: '250px' }}>
            {/* Timeline toolbar */}
            <div className="flex items-center justify-between px-2 py-1 bg-[#0a0a1f] border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Playback controls */}
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(0)} title="Inicio">
                    <ArrowLeftToLine className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(Math.max(0, currentTime - 1))} title="-1s">
                    <ChevronLeft className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400 shadow-lg shadow-blue-500/25" onClick={() => setIsPlaying(!isPlaying)} title={isPlaying ? 'Pausar' : 'Reproducir'}>
                    {isPlaying ? <span className="text-[10px] font-bold">II</span> : <span className="text-[10px] font-bold ml-0.5">&#9654;</span>}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))} title="+1s">
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setCurrentTime(totalDuration)} title="Fin">
                    <ArrowRightToLine className="h-3 w-3" />
                  </Button>
                </div>

                <span className="text-[10px] text-white/40 font-mono ml-1">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom */}
                <div className="flex items-center gap-0.5 bg-white/3 rounded-md px-1 py-0.5">
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setZoom(zoom - 20)}>
                    <ZoomOut className="h-2.5 w-2.5" />
                  </Button>
                  <span className="text-[9px] text-white/30 font-mono w-7 text-center">{zoom}px</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setZoom(zoom + 20)}>
                    <ZoomIn className="h-2.5 w-2.5" />
                  </Button>
                </div>

                {/* Track add buttons */}
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-white/25 hover:text-white/50 hover:bg-white/5 px-1.5" onClick={() => addTrack({ type: 'video', name: 'Video ' + (tracks.filter(t => t.type === 'video').length + 1), muted: false, locked: false, visible: true, height: 64 })}>
                    <Plus className="h-2.5 w-2.5 mr-0.5" />Video
                  </Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-white/25 hover:text-white/50 hover:bg-white/5 px-1.5" onClick={() => addTrack({ type: 'audio', name: 'Audio ' + (tracks.filter(t => t.type === 'audio').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                    <Plus className="h-2.5 w-2.5 mr-0.5" />Audio
                  </Button>
                  <Button variant="ghost" size="sm" className="h-5 text-[9px] text-white/25 hover:text-white/50 hover:bg-white/5 px-1.5" onClick={() => addTrack({ type: 'text', name: 'Texto ' + (tracks.filter(t => t.type === 'text').length + 1), muted: false, locked: false, visible: true, height: 48 })}>
                    <Plus className="h-2.5 w-2.5 mr-0.5" />Texto
                  </Button>
                </div>

                <Badge variant="secondary" className="text-[9px] bg-white/3 text-white/30 border-white/5">
                  {tracks.length} pistas &bull; {clips.length} clips
                </Badge>
              </div>
            </div>

            {/* Timeline content */}
            <ScrollArea className="flex-1">
              <div ref={timelineContentRef} className="relative min-w-full">
                <div className="sticky top-0 z-10">
                  <div className="flex">
                    <div className="w-[120px] flex-shrink-0 bg-[#12122a] border-b border-white/5 border-r border-white/5" />
                    <TimelineRuler />
                  </div>
                </div>
                <div className="relative">
                  <div className="sticky left-0 pointer-events-none z-20" style={{ width: '120px' }} />
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

        {/* RIGHT: Properties Panel */}
        <div className="w-[240px] flex-shrink-0 border-l border-white/5">
          <PropertiesPanel />
        </div>
      </div>

      {/* ===== BOTTOM STATUS BAR ===== */}
      <div className="flex items-center justify-between px-3 py-1 border-t border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/20">
            WebM | YouTube, Instagram, TikTok, Facebook
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] text-white/20">
            Espacio = Play/Pausa
          </span>
          <span className="text-[9px] text-white/20">
            1-7 = Herramientas
          </span>
          <span className="text-[9px] text-white/20">
            Supr = Eliminar
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
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0') + '.' + ms
}