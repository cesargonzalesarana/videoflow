'use client'

import { Track } from '@/lib/timeline-store'
import { useTimelineStore } from '@/lib/timeline-store'
import { TimelineClipBlock } from './TimelineClipBlock'

const trackColors: Record<string, string> = {
  video: 'bg-blue-600/80',
  audio: 'bg-green-600/80',
  text: 'bg-yellow-600/80',
  image: 'bg-purple-600/80',
}

const trackIcons: Record<string, string> = {
  video: '🎬',
  audio: '🔊',
  text: '📝',
  image: '🖼️',
}

interface Props {
  track: Track
}

export function TimelineTrack({ track }: Props) {
  const { zoom, setSelectedClipId } = useTimelineStore()
  const pixelsPerSecond = 10 * zoom
  const totalWidth = 300 * pixelsPerSecond

  return (
    <div className="flex border-b border-[#2a2a4a] group" style={{ width: totalWidth }}>
      {/* Track header */}
      <div className="w-32 flex-shrink-0 bg-[#16162a] flex items-center gap-2 px-3 border-r border-[#2a2a4a]">
        <span className="text-sm">{trackIcons[track.type]}</span>
        <span className="text-xs text-gray-300 truncate">{track.name}</span>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => {
              const store = useTimelineStore.getState()
              store.setTracks(
                store.tracks.map((t) =>
                  t.id === track.id ? { ...t, muted: !t.muted } : t
                )
              )
            }}
            className={`text-[10px] px-1 rounded ${track.muted ? 'text-red-400' : 'text-gray-500'} hover:text-white`}
          >
            M
          </button>
        </div>
      </div>
      {/* Track content */}
      <div
        className="flex-1 h-14 relative"
        onMouseDown={(e) => { if (!e.target.closest('[data-clip]')) setSelectedClipId(null) }}
      >
        {track.clips.map((clip) => (
          <TimelineClipBlock key={clip.id} clip={clip} track={track} />
        ))}
        {track.clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] text-gray-600 select-none">
              Arrastra archivos aquí
            </span>
          </div>
        )}
      </div>
    </div>
  )
}