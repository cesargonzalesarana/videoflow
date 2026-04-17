'use client'

import { Clip, Track } from '@/lib/timeline-store'
import { useTimelineStore } from '@/lib/timeline-store'
import { useRef, useState, useCallback } from 'react'

const clipColors: Record<string, string> = {
  video: 'from-blue-500 to-blue-700 border-blue-400',
  audio: 'from-green-500 to-green-700 border-green-400',
  text: 'from-yellow-500 to-yellow-700 border-yellow-400',
  image: 'from-purple-500 to-purple-700 border-purple-400',
}

interface Props {
  clip: Clip
  track: Track
}

export function TimelineClipBlock({ clip, track }: Props) {
  const { zoom, selectedClipId, setSelectedClipId, moveClip, updateClip, removeClip } = useTimelineStore()
  const pixelsPerSecond = 10 * zoom
  const left = clip.startTime * pixelsPerSecond
  const width = clip.duration * pixelsPerSecond
  const isSelected = selectedClipId === clip.id
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragStartX = useRef(0)
  const dragStartTime = useRef(0)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()
    setSelectedClipId(clip.id)
    setIsDragging(true)
    dragStartX.current = e.clientX
    dragStartTime.current = clip.startTime

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current
      const deltaTime = deltaX / pixelsPerSecond
      const newTime = Math.max(0, Math.min(dragStartTime.current + deltaTime, 300 - clip.duration))
      moveClip(clip.id, newTime)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [clip.id, clip.duration, pixelsPerSecond, moveClip, setSelectedClipId])

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    dragStartX.current = e.clientX

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartX.current
      const newDuration = Math.max(0.5, clip.duration + deltaX / pixelsPerSecond)
      updateClip(clip.id, { duration: newDuration })
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [clip.id, clip.duration, pixelsPerSecond, updateClip])

  const fadeInWidth = (clip.fadeIn ?? 0) * pixelsPerSecond
  const fadeOutWidth = (clip.fadeOut ?? 0) * pixelsPerSecond

  return (
    <div
      data-clip="true"
      className={`absolute top-1 h-[calc(100%-8px)] rounded-md bg-gradient-to-b border cursor-grab active:cursor-grabbing transition-shadow select-none overflow-hidden ${
        clipColors[clip.type]
      } ${isSelected ? 'ring-2 ring-white shadow-lg shadow-purple-500/20' : 'border-white/20 opacity-90 hover:opacity-100'}`}
      style={{ left, width: Math.max(width, 20) }}
      onMouseDown={handleMouseDown}
    >
      {/* Fade In overlay */}
      {fadeInWidth > 0 && (
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-black/70 to-transparent pointer-events-none"
          style={{ width: Math.min(fadeInWidth, width) }}
        />
      )}

      {/* Fade Out overlay */}
      {fadeOutWidth > 0 && (
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-black/70 to-transparent pointer-events-none"
          style={{ width: Math.min(fadeOutWidth, width) }}
        />
      )}

      {/* Clip content */}
      <div className="px-2 py-1 overflow-hidden relative z-10">
        <p className="text-[10px] text-white font-medium truncate">{clip.name}</p>
        <p className="text-[9px] text-white/60">
          {clip.duration.toFixed(1)}s
          {clip.fadeIn ? ' 🟢' : ''}
          {clip.fadeOut ? ' 🔴' : ''}
        </p>
      </div>

      {/* Fade indicators */}
      {fadeInWidth > 5 && (
        <div className="absolute bottom-0.5 left-1 z-10 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-green-400/80" />
        </div>
      )}
      {fadeOutWidth > 5 && (
        <div className="absolute bottom-0.5 right-1 z-10 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-orange-400/80" />
        </div>
      )}

      {/* Resize handle */}
      <div
        className="absolute right-0 top-0 w-2 h-full cursor-col-resize rounded-r-md hover:bg-white/20"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  )
}