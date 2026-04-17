'use client'

import { useTimelineStore } from '@/lib/timeline-store'

export function Playhead() {
  const { currentTime, zoom } = useTimelineStore()
  const pixelsPerSecond = 10 * zoom
  const left = currentTime * pixelsPerSecond

  return (
    <div
      className="absolute top-0 bottom-0 pointer-events-none z-20"
      style={{ left: 128 + left, transform: 'translateX(-0.5px)' }}
    >
      <div className="w-3 h-3 bg-red-500 absolute -top-1 -left-[5px] clip-playhead" />
      <div className="w-0.5 h-full bg-red-500" />
    </div>
  )
}