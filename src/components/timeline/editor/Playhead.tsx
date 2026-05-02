'use client'

import React, { useCallback } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'

const HEADER_WIDTH = 140

export function Playhead() {
  const currentTime = useTimelineStore((s) => s.currentTime)
  const zoom = useTimelineStore((s) => s.zoom)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const getTotalDuration = useTimelineStore((s) => s.getTotalDuration)
  const totalDuration = useTimelineStore(getTotalDuration)

  const playheadX = HEADER_WIDTH + currentTime * zoom

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const container = document.querySelector('[data-timeline-scroll]')
      if (!container) return
      const rect = container.getBoundingClientRect()

      const startX = e.clientX
      const onMove = (moveEvent: MouseEvent) => {
        const x = moveEvent.clientX - rect.left + container.scrollLeft - HEADER_WIDTH
        const time = Math.max(0, Math.min(x / zoom, totalDuration))
        setCurrentTime(time)
      }

      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }

      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)

      onMove(e)
    },
    [zoom, totalDuration, setCurrentTime]
  )

  return (
    <div
      className="absolute z-30"
      style={{
        left: `${playheadX}px`,
        top: 0,
        bottom: 0,
        width: '14px',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Triangle marker at top */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '2px',
          width: 0,
          height: 0,
          borderLeft: '5px solid transparent',
          borderRight: '5px solid transparent',
          borderTop: '8px solid #ef4444',
        }}
      />
      {/* Vertical red line */}
      <div
        className="absolute"
        style={{
          top: 8,
          bottom: 0,
          left: '6px',
          width: '2px',
          backgroundColor: '#ef4444',
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            width: '2px',
            backgroundColor: 'rgba(248,113,113,0.3)',
            filter: 'blur(2px)',
          }}
        />
      </div>
      <div className="absolute top-0 bottom-0 left-0 w-full cursor-col-resize" />
    </div>
  )
}