'use client'

import React, { useCallback, useRef } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { TRACK_HEADER_WIDTH } from './TimelineEditor'

export function Playhead() {
  const currentTime = useTimelineStore((s) => s.currentTime)
  const zoom = useTimelineStore((s) => s.zoom)
  const scrollX = useTimelineStore((s) => s.scrollX)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const rawTracks = useTimelineStore((s) => s.tracks)
  const getTotalDuration = useTimelineStore((s) => s.getTotalDuration)
  const totalDuration = useTimelineStore(getTotalDuration)

  const tracks = Array.isArray(rawTracks) ? rawTracks.filter(Boolean) : []
  const totalHeight = tracks.reduce((sum, t) => sum + (t.height || 0), 0)
  // Position the playhead STARTING from after the track names column
  const playheadX = currentTime * zoom - scrollX + TRACK_HEADER_WIDTH
  const isDragging = useRef(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true

    const handleMove = (moveEvent: MouseEvent) => {
      if (!isDragging.current) return
      const timelineContent = document.querySelector('[data-timeline-content]')
      if (!timelineContent) return
      const rect = timelineContent.getBoundingClientRect()
      const x = moveEvent.clientX - rect.left - TRACK_HEADER_WIDTH + scrollX
      const time = Math.max(0, Math.min(x / zoom, totalDuration))
      setCurrentTime(time)
    }

    const handleUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
  }, [zoom, scrollX, totalDuration, setCurrentTime])

  return (
    <>
      {/* Invisible wide click target for easy grabbing */}
      <div
        className="absolute top-0 z-20 cursor-col-resize"
        style={{
          left: `${playheadX - 6}px`,
          width: '12px',
          height: `${totalHeight}px`,
        }}
        onMouseDown={handleMouseDown}
      />
      {/* Visible red line */}
      <div
        className="absolute top-0 w-px bg-red-500 z-20 pointer-events-none"
        style={{
          left: `${playheadX}px`,
          height: `${totalHeight}px`,
        }}
      >
        <div className="absolute inset-0 w-px bg-red-400/30 blur-sm" />
      </div>
    </>
  )
}