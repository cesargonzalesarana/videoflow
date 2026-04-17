'use client'

import React, { useCallback, useRef, useEffect } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'

export function TimelineRuler() {
  const zoom = useTimelineStore((s) => s.zoom)
  const scrollX = useTimelineStore((s) => s.scrollX)
  const currentTime = useTimelineStore((s) => s.currentTime)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const getTotalDuration = useTimelineStore((s) => s.getTotalDuration)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalDuration = useTimelineStore(getTotalDuration)
  const totalWidth = totalDuration * zoom

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left + scrollX
      const time = Math.max(0, x / zoom)
      setCurrentTime(Math.min(time, totalDuration))
    },
    [zoom, scrollX, totalDuration, setCurrentTime]
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

  const playheadX = currentTime * zoom - scrollX

  return (
    <div
      ref={containerRef}
      className="h-8 relative bg-[#1a1a2e] border-b border-white/5 cursor-pointer select-none overflow-hidden flex-shrink-0"
      onClick={handleClick}
    >
      <div className="absolute inset-0" style={{ width: `${totalWidth}px` }}>
        {markers.map((marker) => (
          <div
            key={marker.time}
            className="absolute top-0"
            style={{ left: `${marker.time * zoom}px` }}
          >
            <div
              className={`w-px ${
                marker.isMajor ? 'h-5 bg-white/30' : 'h-3 bg-white/15'
              }`}
            />
            {marker.isMajor && (
              <span className="absolute top-5 left-1 text-[10px] text-white/40 font-mono whitespace-nowrap select-none">
                {marker.label}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Playhead marker on ruler */}
      {playheadX >= 0 && playheadX <= containerRef.current?.clientWidth && (
        <div
          className="absolute top-0 w-3 h-3 bg-red-500 z-20"
          style={{
            left: `${playheadX - 6}px`,
            clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          }}
        />
      )}
    </div>
  )
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}
