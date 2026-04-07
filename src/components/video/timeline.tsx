'use client'

import { useAppStore, type TimelineClip } from '@/lib/store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { GripVertical, Film, Image as ImageIcon, Music, Type, Trash2 } from 'lucide-react'

const clipColors: Record<string, string> = {
  video: 'from-purple-500 to-purple-600',
  image: 'from-fuchsia-500 to-fuchsia-600',
  audio: 'from-green-500 to-green-600',
  text: 'from-amber-500 to-amber-600',
}

const clipIcons: Record<string, React.ReactNode> = {
  video: <Film className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  audio: <Music className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
}

export function Timeline() {
  const { timelineClips, removeTimelineClip } = useAppStore()

  if (timelineClips.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Timeline
        </span>
        <Badge variant="secondary" className="text-xs">
          {timelineClips.length} clips
        </Badge>
      </div>
      <ScrollArea className="w-full">
        <div className="flex items-end gap-1 min-w-max pb-1">
          {/* Time markers */}
          <div className="flex items-center gap-1 mr-2">
            {Array.from({ length: Math.ceil(timelineClips.reduce((sum, c) => sum + c.duration, 0) / 5) + 1 }).map((_, i) => (
              <span key={i} className="text-[10px] text-muted-foreground font-mono w-[200px] flex-shrink-0">
                {i * 5}s
              </span>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
