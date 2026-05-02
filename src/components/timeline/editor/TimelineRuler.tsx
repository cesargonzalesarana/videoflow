'use client'

import React, { useCallback, useRef } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'

export function TimelineRuler() {
  const zoom = useTimelineStore((s) => s.zoom)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const getTotalDuration = useTimelineStore((s) => s.getTotalDuration)
  const totalDuration = useTimelineStore(getTotalDuration)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalWidth = totalDuration * zoom

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const time = Math.max(0, Math.min(x / zoom, totalDuration))
      setCurrentTime(time)
    },
    [zoom, totalDuration, setCurrentTime]
  )

  const markers: { time: number; isMajor: boolean; label: string }[] = []
  let interval = 1
  if (zoom < 30) interval = 10
  else if (zoom < 60) interval = 5
  else if (zoom < 120) interval = 2

  for (let t = 0; t <= totalDuration; t += interval) {
    const isMajor = t % (interval * 5) === 0 || t === 0
    const label = isMajor ? formatTime(t) : ''
    markers.push({ time: t, isMajor, label })
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full cursor-pointer select-none overflow-hidden"
      onClick={handleClick}
    >
      <div className="absolute top-0 left-0 h-full" style={{ width: `${totalWidth}px` }}>
        {markers.map((marker) => (
          <div
            key={marker.time}
            className="absolute top-0"
            style={{ left: `${marker.time * zoom}px` }}
          >
            <div
              className={`w-px ${
                marker.isMajor ? 'h-[14px] bg-white/30' : 'h-[8px] bg-white/15'
              }`}
            />
            {marker.isMajor && (
              <span className="absolute left-1 text-[9px] text-white/40 font-mono whitespace-nowrap select-none" style={{ top: 15 }}>
                {marker.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}