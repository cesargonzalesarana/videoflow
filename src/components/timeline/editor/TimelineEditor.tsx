'use client'

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'
import { Playhead } from './Playhead'
import { MediaPanel, MediaPanelRef } from './MediaPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PreviewCanvas } from './PreviewCanvas'
import { Button } from '@/components/ui/button'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ZoomIn, ZoomOut, Download, Loader2, Trash2, Film,
  ArrowLeftToLine, ArrowRightToLine, ChevronLeft, ChevronRight,
  Plus, Volume2, VolumeX, ArrowLeft, Save, FolderOpen, TrashIcon
} from 'lucide-react'
import { toast } from 'sonner'
import { exportWithAudio } from './exportWithAudio'
import {
  saveProject,
  loadProject,
  listProjects,
  deleteProject,
  type ProjectInfo,
} from '@/lib/project-storage'

export function TimelineEditor() {
  const {
    tracks, clips, currentTime, isPlaying, zoom,
    setIsPlaying, setCurrentTime, setZoom, initializeDefaultTracks,
    clearAll, scrollX, setScrollX, getTotalDuration,
    addTrack, setTracks, setClips, setSelectedClipId
  } = useTimelineStore()

  const { isProcessing, setProcessing, setProcessingProgress, processingProgress } = useAppStore()
  const timelineContentRef = useRef<HTMLDivElement>(null)
  const mediaPanelRef = useRef<MediaPanelRef>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)

  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [savedProjects, setSavedProjects] = useState<ProjectInfo[]>([])
  const [loadingProject, setLoadingProject] = useState(false)

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
    await exportWithAudio(clips, audioEnabled, setProcessing, setProcessingProgress)
  }

  const handleVolver = () => {
    useAppStore.getState().setView('dashboard')
  }

  const handleSaveProject = useCallback(async () => {
    const name = window.prompt('Nombre del proyecto:', 'Mi Proyecto')
    if (!name || !name.trim()) return

    try {
      const mediaItems = mediaPanelRef.current?.getMediaItems() || []
      await saveProject(name.trim(), tracks, clips as any[], mediaItems as any[])
      toast.success(`Proyecto "${name.trim()}" guardado`)
    } catch (err) {
      console.error('Error saving project:', err)
      toast.error('Error al guardar el proyecto')
    }
  }, [tracks, clips])

  const handleOpenProjects = useCallback(() => {
    setSavedProjects(listProjects())
    setProjectDialogOpen(true)
  }, [])

  const handleLoadProject = useCallback(async (name: string) => {
    setLoadingProject(true)
    try {
      const data = await loadProject(name)
      setIsPlaying(false)
      setCurrentTime(0)
      setSelectedClipId(null)
      setTracks(data.tracks as any[])
      setClips(data.clips as any[])
      mediaPanelRef.current?.loadMediaItems(data.mediaItems as any[])
      setProjectDialogOpen(false)
      toast.success(`Proyecto "${name}" cargado`)
    } catch (err) {
      console.error('Error loading project:', err)
      toast.error('Error al cargar el proyecto')
    } finally {
      setLoadingProject(false)
    }
  }, [setTracks, setClips, setIsPlaying, setCurrentTime, setSelectedClipId])

  const handleDeleteProject = useCallback((name: string) => {
    if (!window.confirm(`Eliminar el proyecto "${name}"?`)) return
    deleteProject(name)
    setSavedProjects(listProjects())
    toast.success(`Proyecto "${name}" eliminado`)
  }, [])

  const formatDate = (isoDate: string) => {
    const d = new Date(isoDate)
    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    const hours = d.getHours().toString().padStart(2, '0')
    const mins = d.getMinutes().toString().padStart(2, '0')
    return `${day}/${month}/${year} ${hours}:${mins}`
  }

  return (
    <div className="h-full flex flex-col bg-[#080818] select-none" onWheel={handleWheel}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a1f] flex-shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-xs text-white/60 hover:text-white hover:bg-white/10 border border-white/10 flex items-center gap-1.5"
            onClick={handleVolver}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
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

          <div className="w-px h-5 bg-white/10 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex items-center gap-1.5 text-white/50 hover:text-white/80 hover:bg-white/10"
            onClick={handleSaveProject}
            disabled={clips.length === 0}
            title="Guardar proyecto"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Guardar</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs flex items-center gap-1.5 text-white/50 hover:text-white/80 hover:bg-white/10"
            onClick={handleOpenProjects}
            title="Abrir proyecto"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Abrir</span>
          </Button>
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

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[240px] flex-shrink-0 border-r border-white/5">
          <MediaPanel ref={mediaPanelRef} />
        </div>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="px-4 pt-3 pb-1" style={{ flex: '3 1 0', minHeight: '150px' }}>
            <PreviewCanvas />
          </div>

          <div className="flex flex-col border-t border-white/5 min-h-[100px]" style={{ flex: '2 1 0' }}>
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

      <Dialog open={projectDialogOpen} onOpenChange={setProjectDialogOpen}>
        <DialogContent className="bg-[#0e0e24] border-white/10 text-white sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white/90">
              <FolderOpen className="h-5 w-5 text-purple-400" />
              Proyectos Guardados
            </DialogTitle>
            <DialogDescription className="text-white/40">
              Selecciona un proyecto para cargar o eliminelo
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
            {savedProjects.length === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                  <FolderOpen className="h-6 w-6 text-white/15" />
                </div>
                <p className="text-sm text-white/30">No hay proyectos guardados</p>
                <p className="text-xs text-white/20 mt-1">
                  Usa el boton "Guardar" para guardar tu trabajo
                </p>
              </div>
            ) : (
              savedProjects.map((project) => (
                <div
                  key={project.name}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/80 truncate">{project.name}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {formatDate(project.updatedAt)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300">
                        {project.clipCount} clips
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300">
                        {project.trackCount} pistas
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300">
                        {project.mediaCount} medios
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white flex-shrink-0"
                    onClick={() => handleLoadProject(project.name)}
                    disabled={loadingProject}
                  >
                    {loadingProject ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      'Cargar'
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white/25 hover:text-red-400 hover:bg-red-400/10 flex-shrink-0"
                    onClick={() => handleDeleteProject(project.name)}
                    title="Eliminar proyecto"
                  >
                    <TrashIcon className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return m.toString().padStart(2, '0') + ':' + s.toString().padStart(2, '0') + '.' + ms
}