'use client'

import React from 'react'
import { useTimelineStore } from '@/lib/timeline-store'

export function Playhead() {
  const currentTime = useTimelineStore((s) => s.currentTime)
  const zoom = useTimelineStore((s) => s.zoom)
  const scrollX = useTimelineStore((s) => s.scrollX)
  const tracks = useTimelineStore((s) => s.tracks)

  const totalHeight = tracks.reduce((sum, t) => sum + t.height, 0)
  const playheadX = currentTime * zoom - scrollX

  if (playheadX < -10) return null

  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-red-500 z-20 pointer-events-none"
      style={{
        left: `${playheadX}px`,
        height: `${totalHeight}px`,
      }}
    >
      {/* Glow effect */}
      <div className="absolute inset-0 w-px bg-red-400/30 blur-sm" />
    </div>
  )
}
