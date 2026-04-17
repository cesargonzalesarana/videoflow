'use client'

import { useTimelineStore } from '@/lib/timeline-store'

export function TimelineRuler() {
  const { zoom, currentTime } = useTimelineStore()
  const pixelsPerSecond = 10 * zoom
  const totalWidth = 300 * pixelsPerSecond
  const interval = zoom >= 2 ? 1 : zoom >= 1 ? 2 : 5

  const marks = []
  for (let i = 0; i <= 300; i += interval) {
    marks.push(i)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="h-8 bg-[#1a1a3a] border-b border-[#2a2a4a] flex flex-shrink-0 overflow-hidden">
      {/* Spacer for track headers */}
      <div className="w-32 flex-shrink-0 bg-[#16162a] border-r border-[#2a2a4a]" />
      {/* Ruler */}
      <div
        className="relative overflow-hidden"
        style={{ width: totalWidth }}
      >
        {marks.map((time) => (
          <div
            key={time}
            className="absolute top-0 h-full flex flex-col items-center"
            style={{ left: time * pixelsPerSecond }}
          >
            <div className="w-px h-2 bg-[#4a4a6a] mt-1" />
            <span className="text-[9px] text-gray-500 mt-0.5 select-none">
              {time % (interval * 2) === 0 ? formatTime(time) : ''}
            </span>
          </div>
        ))}
        <div
          className="absolute top-0 w-0.5 h-full bg-purple-500 pointer-events-none z-10"
          style={{ left: currentTime * pixelsPerSecond }}
        />
      </div>
    </div>
  )
}