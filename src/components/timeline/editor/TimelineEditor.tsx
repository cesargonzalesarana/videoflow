'use client'

import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineRuler } from './TimelineRuler'
import { TimelineTrack } from './TimelineTrack'
import { Playhead } from './Playhead'
import { MediaPanel } from './MediaPanel'
import { PropertiesPanel } from './PropertiesPanel'
import { PreviewCanvas } from './PreviewCanvas'
import { useRef, useEffect } from 'react'

export function TimelineEditor() {
  const { tracks, currentTime, isPlaying, zoom, setCurrentTime, setIsPlaying, setZoom } = useTimelineStore()
  const timelineRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = performance.now()
      const animate = (now: number) => {
        const delta = (now - lastTimeRef.current) / 1000
        lastTimeRef.current = now
        setCurrentTime(Math.min(currentTime + delta, 300))
        if (currentTime + delta >= 300) setIsPlaying(false)
        else animRef.current = requestAnimationFrame(animate)
      }
      animRef.current = requestAnimationFrame(animate)
    }
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [isPlaying])

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || (e.target as HTMLElement).closest('[data-clip]')) return
    const rect = timelineRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const time = Math.max(0, Math.min(x / (10 * zoom), 300))
    setCurrentTime(time)
  }

  return (
    <div className="h-screen flex flex-col bg-[#1a1a2e] text-white overflow-hidden">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#16162a] border-b border-[#2a2a4a]">
        <div className="flex items-center gap-3">
                      <button onClick={() => window.location.href = '/'} className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>Volver</button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            VideoFlow Editor
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors"
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
          <button
            onClick={() => setCurrentTime(0)}
            className="w-10 h-10 rounded-lg bg-[#2a2a4a] hover:bg-[#3a3a5a] flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
          </button>
          <span className="ml-2 text-sm font-mono text-gray-300 min-w-[100px]">
            {Math.floor(currentTime / 60).toString().padStart(2, '0')}:
            {Math.floor(currentTime % 60).toString().padStart(2, '0')}.
            {Math.floor((currentTime % 1) * 30).toString().padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Zoom</span>
          <input
            type="range" min="0.25" max="4" step="0.25" value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-24 accent-purple-500"
          />
          <span className="text-xs text-gray-400 w-8">{zoom}x</span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Media */}
        <MediaPanel />

        {/* Center - Preview + Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0">
            <PreviewCanvas />
          </div>
          <div className="h-[250px] border-t border-[#2a2a4a] bg-[#12122a] flex flex-col overflow-hidden">
            <TimelineRuler />
            <div
              ref={timelineRef}
              className="flex-1 overflow-y-auto overflow-x-auto relative"
              onClick={handleTimelineClick}
            >
              <Playhead />
              {tracks.map((track) => (
                <TimelineTrack key={track.id} track={track} />
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Properties */}
        <PropertiesPanel />
      </div>
    </div>
  )
}