'use client'

import React, { useCallback, useRef, useState } from 'react'
import { useTimelineStore, type TimelineClipData } from '@/lib/timeline-store'
import {
  Film, Image as ImageIcon, Music, Type,
  GripVertical, Trash2, Copy, Scissors
} from 'lucide-react'

interface TimelineClipBlockProps {
  clip: TimelineClipData
  trackId: string
  isSelected: boolean
  isLocked: boolean
  zoom: number
}

const clipStyles: Record<string, { bg: string; bgHover: string; border: string; borderSelected: string; shadow: string }> = {
  video: {
    bg: 'bg-gradient-to-r from-violet-600 to-purple-600',
    bgHover: 'hover:from-violet-500 hover:to-purple-500',
    border: 'border-violet-500/30',
    borderSelected: 'border-white/60',
    shadow: 'shadow-violet-500/20',
  },
  audio: {
    bg: 'bg-gradient-to-r from-emerald-600 to-green-600',
    bgHover: 'hover:from-emerald-500 hover:to-green-500',
    border: 'border-emerald-500/30',
    borderSelected: 'border-white/60',
    shadow: 'shadow-emerald-500/20',
  },
  text: {
    bg: 'bg-gradient-to-r from-amber-600 to-yellow-600',
    bgHover: 'hover:from-amber-500 hover:to-yellow-500',
    border: 'border-amber-500/30',
    borderSelected: 'border-white/60',
    shadow: 'shadow-amber-500/20',
  },
  image: {
    bg: 'bg-gradient-to-r from-pink-600 to-rose-600',
    bgHover: 'hover:from-pink-500 hover:to-rose-500',
    border: 'border-pink-500/30',
    borderSelected: 'border-white/60',
    shadow: 'shadow-pink-500/20',
  },
}

const clipIcons: Record<string, React.ReactNode> = {
  video: <Film className="h-3 w-3" />,
  image: <ImageIcon className="h-3 w-3" />,
  audio: <Music className="h-3 w-3" />,
  text: <Type className="h-3 w-3" />,
}

export function TimelineClipBlock({ clip, trackId, isSelected, isLocked, zoom }: TimelineClipBlockProps) {
  // NUCLEAR GUARD: if clip is undefined/null, render nothing
  if (!clip) {
    console.warn('[VideoFlow] TimelineClipBlock received undefined clip')
    return null
  }

  const setSelectedClipId = useTimelineStore((s) => s.setSelectedClipId)
  const updateClip = useTimelineStore((s) => s.updateClip)
  const removeClip = useTimelineStore((s) => s.removeClip)
  const moveClip = useTimelineStore((s) => s.moveClip)
  const splitClip = useTimelineStore((s) => s.splitClip)
  const duplicateClip = useTimelineStore((s) => s.duplicateClip)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStartX, setDragStartX] = useState(0)
  const [dragStartTime, setDragStartTime] = useState(0)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeEdge, setResizeEdge] = useState<'left' | 'right' | null>(null)
  const [resizeStartX, setResizeStartX] = useState(0)
  const [resizeOrigStart, setResizeOrigStart] = useState(0)
  const [resizeOrigDuration, setResizeOrigDuration] = useState(0)
  const [showActions, setShowActions] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)

  const style = clipStyles[clip.type] || clipStyles.video

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isLocked) return
      e.stopPropagation()

      if (blockRef.current) {
        const rect = blockRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        if (x < 8) {
          setIsResizing(true)
          setResizeEdge('left')
          setResizeStartX(e.clientX)
          setResizeOrigStart(clip.startTime)
          setResizeOrigDuration(clip.duration)
          return
        }
        if (x > rect.width - 8) {
          setIsResizing(true)
          setResizeEdge('right')
          setResizeStartX(e.clientX)
          setResizeOrigDuration(clip.duration)
          return
        }
      }

      setSelectedClipId(clip.id)
      setIsDragging(true)
      setDragStartX(e.clientX)
      setDragStartTime(clip.startTime)
    },
    [clip.id, clip.startTime, clip.duration, isLocked, setSelectedClipId]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStartX
        const dt = dx / (zoom || 80)
        const newStartTime = Math.max(0, Math.round((dragStartTime + dt) * 10) / 10)
        moveClip(clip.id, trackId, newStartTime)
      }
      if (isResizing && resizeEdge) {
        const dx = e.clientX - resizeStartX
        const dt = dx / (zoom || 80)
        if (resizeEdge === 'right') {
          const newDuration = Math.max(0.5, resizeOrigDuration + dt)
          updateClip(clip.id, {
            duration: newDuration,
            trimEnd: clip.trimStart + newDuration,
          })
        } else if (resizeEdge === 'left') {
          const newStartTime = Math.max(0, resizeOrigStart + dt)
          const timeDiff = newStartTime - resizeOrigStart
          const newDuration = Math.max(0.5, resizeOrigDuration - timeDiff)
          updateClip(clip.id, {
            startTime: newStartTime,
            duration: newDuration,
            trimStart: clip.trimStart + timeDiff,
          })
        }
      }
    },
    [isDragging, isResizing, dragStartX, dragStartTime, resizeStartX, resizeEdge, resizeOrigStart, resizeOrigDuration, zoom, clip.id, clip.trimStart, trackId, moveClip, updateClip]
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeEdge(null)
  }, [])

  React.useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedClipId(clip.id)
    setCurrentTime(clip.startTime || 0)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeClip(clip.id)
  }

  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateClip(clip.id)
  }

  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation()
    const midTime = (clip.startTime || 0) + (clip.duration || 0) / 2
    splitClip(clip.id, midTime)
  }

  const clipLeft = (clip.startTime || 0) * (zoom || 80)
  const clipWidth = Math.max((clip.duration || 0) * (zoom || 80), 20)

  return (
    <div
      ref={blockRef}
      className={`absolute top-1 bottom-1 rounded-md flex items-center overflow-hidden cursor-pointer transition-shadow group ${
        style.bg
      } ${style.bgHover} ${
        isSelected
          ? `ring-2 ring-white/70 ${style.shadow} shadow-lg z-10`
          : 'z-0'
      } ${isDragging ? 'opacity-80 shadow-2xl' : ''}`}
      style={{
        left: `${clipLeft}px`,
        width: `${clipWidth}px`,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Left resize handle */}
      {!isLocked && (
        <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize bg-white/0 hover:bg-white/20 rounded-l-md transition-colors" />
      )}

      {/* Right resize handle */}
      {!isLocked && (
        <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize bg-white/0 hover:bg-white/20 rounded-r-md transition-colors" />
      )}

      {/* Clip content */}
      <div className="flex items-center gap-1.5 px-2 min-w-0 flex-1">
        {clipIcons[clip.type] || clipIcons.video}
        <span className="text-[11px] text-white font-medium truncate">
          {clip.name || 'Clip'}
        </span>
        {clipWidth > 80 && (
          <span className="text-[9px] text-white/50 ml-auto flex-shrink-0 font-mono">
            {(clip.duration || 0).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Transition indicator */}
      {clip.transition && clip.transition !== 'none' && (
        <div className="absolute left-0 top-0 bottom-0 w-4 bg-white/10 flex items-center justify-center">
          <div className="w-0 h-0 border-l-[4px] border-l-white/30 border-y-[3px] border-y-transparent" />
        </div>
      )}

      {/* Waveform simulation for audio */}
      {clip.type === 'audio' && (
        <div className="absolute inset-0 flex items-center px-1 gap-[1px] opacity-30 pointer-events-none">
          {Array.from({ length: Math.min(Math.floor(clipWidth / 4), 80) }).map((_, i) => {
            const h = 10 + Math.random() * 20
            return (
              <div
                key={i}
                className="w-[2px] bg-white rounded-full flex-shrink-0"
                style={{ height: `${h}%` }}
              />
            )
          })}
        </div>
      )}

      {/* Video thumbnail strip */}
      {clip.type === 'video' && clip.previewUrl && clipWidth > 60 && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img
            src={clip.previewUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Image thumbnail */}
      {clip.type === 'image' && clip.previewUrl && (
        <div className="absolute inset-0 opacity-30 pointer-events-none rounded-md overflow-hidden">
          <img
            src={clip.previewUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Text preview */}
      {clip.type === 'text' && clip.text && clipWidth > 40 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] text-white/60 px-1 truncate max-w-[90%]">
            {clip.text}
          </span>
        </div>
      )}

      {/* Action buttons (visible on hover when selected) */}
      {isSelected && showActions && !isLocked && clipWidth > 150 && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-[#1e1e3a] rounded-md px-1 py-0.5 shadow-xl border border-white/10 z-30">
          <button
            onClick={handleSplit}
            className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded"
            title="Dividir clip"
          >
            <Scissors className="h-3 w-3" />
          </button>
          <button
            onClick={handleDuplicate}
            className="w-5 h-5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 rounded"
            title="Duplicar clip"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="w-5 h-5 flex items-center justify-center text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded"
            title="Eliminar clip"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  )
}
