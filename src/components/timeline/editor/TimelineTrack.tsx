'use client'

import React, { useMemo } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineClipBlock } from './TimelineClipBlock'

interface TimelineTrackProps {
  track: {
    id: string
    type: string
    name: string
    muted: boolean
    locked: boolean
    visible: boolean
    height: number
  }
}

export function TimelineTrack({ track }: TimelineTrackProps) {
  const zoom = useTimelineStore((s) => s.zoom)
  const updateTrack = useTimelineStore((s) => s.updateTrack)
  const selectedClipId = useTimelineStore((s) => s.selectedClipId)
  const setSelectedClipId = useTimelineStore((s) => s.setSelectedClipId)
  const addClip = useTimelineStore((s) => s.addClip)
  const getTotalDuration = useTimelineStore((s) => s.getTotalDuration)
  const totalDuration = useTimelineStore(getTotalDuration)

  const allClips = useTimelineStore((s) => s.clips || [])
  const clips = useMemo(
    () => allClips.filter((c) => c.trackId === track.id).sort((a, b) => a.startTime - b.startTime),
    [allClips, track.id]
  )

  const totalWidth = totalDuration * zoom

  const trackColors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
    video: { bg: '#7c3aed', border: '#8b5cf6', text: '#c4b5fd', icon: 'V' },
    audio: { bg: '#059669', border: '#10b981', text: '#6ee7b7', icon: 'A' },
    text: { bg: '#d97706', border: '#f59e0b', text: '#fcd34d', icon: 'T' },
    image: { bg: '#db2777', border: '#ec4899', text: '#f9a8d4', icon: 'I' },
  }

  const colors = trackColors[track.type] || trackColors.video

  const handleTrackClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedClipId(null)
    }
  }

  const handleDropOnTrack = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/clip-data'))
      if (!data) return

      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const startTime = Math.max(0, Math.round((x / zoom) * 10) / 10)

      addClip({
        trackId: track.id,
        type: data.type,
        name: data.name,
        startTime,
        duration: data.duration || 5,
        trimStart: 0,
        trimEnd: data.duration || 5,
        file: data.file,
        previewUrl: data.previewUrl,
        text: data.text,
        volume: 100,
        opacity: 100,
        scale: 100,
        positionX: 50,
        positionY: 50,
        transition: 'none',
        filter: 'none',
      })
    } catch {
      // ignore invalid drag data
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="flex items-stretch border-b border-white/5 last:border-b-0 select-none">
      {/* Track header - STICKY LEFT */}
      <div
        className="w-[140px] flex-shrink-0 flex items-center gap-2 px-3 border-r border-white/5 bg-[#12122a] sticky left-0 z-10"
        style={{ height: `${track.height}px` }}
      >
        <div
          className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold flex-shrink-0"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {colors.icon}
        </div>
        <span className="text-xs text-white/70 truncate flex-1">{track.name}</span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => updateTrack(track.id, { muted: !track.muted })}
            className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold ${
              track.muted ? 'text-red-400 bg-red-400/10' : 'text-white/30 hover:text-white/60'
            }`}
            title={track.muted ? 'Desmutear' : 'Mutear'}
          >
            M
          </button>
          <button
            onClick={() => updateTrack(track.id, { locked: !track.locked })}
            className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold ${
              track.locked ? 'text-amber-400 bg-amber-400/10' : 'text-white/30 hover:text-white/60'
            }`}
            title={track.locked ? 'Desbloquear' : 'Bloquear'}
          >
            L
          </button>
          <button
            onClick={() => updateTrack(track.id, { visible: !track.visible })}
            className={`w-4 h-4 flex items-center justify-center rounded text-[9px] font-bold ${
              track.visible ? 'text-green-400 bg-green-400/10' : 'text-white/20'
            }`}
            title={track.visible ? 'Ocultar' : 'Mostrar'}
          >
            {track.visible ? 'O' : '—'}
          </button>
        </div>
      </div>

      {/* Track content area */}
      <div
        className="flex-1 relative overflow-hidden bg-[#0d0d1f]"
        style={{ height: `${track.height}px` }}
        onClick={handleTrackClick}
        onDrop={handleDropOnTrack}
        onDragOver={handleDragOver}
      >
        <div className="absolute inset-0" style={{ width: `${totalWidth}px` }}>
          {Array.from({ length: Math.ceil(totalDuration / 5) + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/[0.03]"
              style={{ left: `${i * 5 * zoom}px` }}
            />
          ))}

          {(clips || []).map((clip) => (
            <TimelineClipBlock
              key={clip.id}
              clip={clip}
              trackId={track.id}
              isSelected={selectedClipId === clip.id}
              isLocked={track.locked}
              zoom={zoom}
            />
          ))}
        </div>
      </div>
    </div>
  )
}