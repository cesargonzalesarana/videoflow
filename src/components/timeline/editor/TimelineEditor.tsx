'use client'

import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'
import { Playhead } from './Playhead'
import { MediaPanel } from './MediaPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PreviewCanvas } from './PreviewCanvas'
import { useRef, useEffect, useCallback, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { ExportPanel } from './ExportPanel'

export function TimelineEditor() {
  const {
    tracks, currentTime, isPlaying, zoom, selectedClipId, snapEnabled,
    setCurrentTime, setIsPlaying, setZoom, setSelectedClipId,
    removeClip, splitClip, duplicateClip, setSnapEnabled, undo, redo
  } = useTimelineStore()
  const timelineRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const currentTimeRef = useRef<number>(0)

  useEffect(() => {
    currentTimeRef.current = currentTime
  }, [currentTime])

  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    switch (e.code) {
      case 'Space':
        e.preventDefault()
        setIsPlaying(!isPlaying)
        break
      case 'Delete':
      case 'Backspace':
        if (selectedClipId) removeClip(selectedClipId)
        break
      case 'KeyS':
        if (!e.ctrlKey && !e.metaKey && selectedClipId) {
          e.preventDefault()
          splitClip(selectedClipId)
        }
        break
      case 'KeyD':
        if ((e.ctrlKey || e.metaKey) && selectedClipId) {
          e.preventDefault()
          duplicateClip(selectedClipId)
        }
        break
      case 'KeyZ':
        if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
          e.preventDefault()
          undo()
        }
        break
      case 'KeyY':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          redo()
        }
        break
      case 'ArrowLeft':
        e.preventDefault()
        setCurrentTime(Math.max(0, currentTime - (e.shiftKey ? 1 : 1 / 30)))
        break
      case 'ArrowRight':
        e.preventDefault()
        setCurrentTime(Math.min(300, currentTime + (e.shiftKey ? 1 : 1 / 30)))
        break
    }
  }, [isPlaying, selectedClipId, currentTime, setIsPlaying, removeClip, splitClip, duplicateClip, undo, redo, setCurrentTime])

  useEffect(() => {
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [handleKeydown])

  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current)
      return
    }
    lastTimeRef.current = performance.now()
    const animate = (now: number) => {
      const delta = (now - lastTimeRef.current) / 1000
      lastTimeRef.current = now
      const newTime = Math.min(currentTimeRef.current + delta, 300)
      currentTimeRef.current = newTime
      setCurrentTime(newTime)
      if (newTime >= 300) {
        setIsPlaying(false)
        return
      }
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [isPlaying, setCurrentTime, setIsPlaying])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || (e.target as HTMLElement).closest('[data-clip]')) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = Math.max(0, Math.min(x / (10 * zoom), 300))
    setCurrentTime(time)
  }

  const totalClips = tracks.reduce((sum, t) => sum + t.clips.length, 0)
    const [showExport, setShowExport] = useState(false)

  return (
    <div className="h-full flex flex-col bg-[#1a1a2e] text-white overflow-hidden rounded-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-[#16162a] border-b border-[#2a2a4a] rounded-t-lg">
        <div className="flex items-center gap-3">
          <button onClick={() => useAppStore.getState().setCurrentView('dashboard')} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Volver
          </button>
          <span className="text-gray-600">|</span>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            VideoFlow Editor
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={undo} className="w-8 h-8 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors" title="Deshacer (Ctrl+Z)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
          </button>
          <button onClick={redo} className="w-8 h-8 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors" title="Rehacer (Ctrl+Y)">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
          </button>
          <span className="text-gray-600 mx-1">|</span>
          <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors" title="Play/Pause (Espacio)">
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button onClick={() => setCurrentTime(0)} className="w-8 h-8 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors" title="Inicio">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
          </button>
          <button onClick={() => setCurrentTime(Math.max(0, currentTime - 5))} className="w-8 h-8 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors" title="Retroceder 5s">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
          </button>
          <button onClick={() => setCurrentTime(Math.min(300, currentTime + 5))} className="w-8 h-8 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors" title="Adelantar 5s">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" /></svg>
          </button>
          <span className="ml-2 text-sm font-mono text-gray-300 min-w-[100px]">
            {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
            {Math.floor(currentTime % 60).toString().padStart(2, '0')}.
            {Math.floor((currentTime % 1) * 30).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSnapEnabled(!snapEnabled)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${snapEnabled ? 'bg-purple-600 text-white' : 'bg-[#2a2a4a] text-gray-500'}`}
            title="Ajuste magnetico"
          >
            🧲 Snap
          </button>
          <span className="text-xs text-gray-400">Zoom</span>
          <input type="range" min="0.25" max="4" step="0.25" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-20 accent-purple-500" />
          <span className="text-xs text-gray-400 w-8">{zoom}x</span>
                    <button
            onClick={() => setShowExport(true)}
            className="ml-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-medium transition-colors flex items-center gap-1"
            title="Exportar video"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar
          </button>
             <ExportPanel isOpen={showExport} onClose={() => setShowExport(false)} />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <MediaPanel />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <PreviewCanvas />
          </div>
          <div className="h-[250px] border-t border-[#2a2a4a] bg-[#12122a] flex flex-col overflow-hidden">
            <TimelineRuler />
            <div ref={timelineRef} className="flex-1 overflow-y-auto overflow-x-auto relative" onClick={handleTimelineClick}>
              <Playhead />
              {tracks.map((track) => (
                <TimelineTrack key={track.id} track={track} />
              ))}
            </div>
          </div>
        </div>
        <PropertiesPanel />
      </div>

      <div className="flex items-center justify-between px-4 py-1 bg-[#16162a] border-t border-[#2a2a4a] text-[10px] text-gray-500 rounded-b-lg">
        <div className="flex items-center gap-4">
          <span>Clips: {totalClips}</span>
          <span>Pistas: {tracks.length}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Espacio: Play/Pause</span>
          <span>S: Cortar</span>
          <span>Ctrl+D: Duplicar</span>
          <span>Del: Eliminar</span>
          <span>←→: Avanzar</span>
        </div>
      </div>
    </div>
  )
}