'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Play, Pause, SkipBack, SkipForward, Maximize, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'framer-motion'

export function PreviewPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration] = useState(45)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(75)
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <Card className="glass border-border/30 overflow-hidden">
      {/* Video area */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-950/50 to-black flex items-center justify-center group">
        {/* Simulated video content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center mx-auto group-hover:bg-purple-500/30 transition-colors">
              <Play className="h-8 w-8 text-purple-400 ml-1" />
            </div>
            <p className="text-sm text-muted-foreground">Preview del video</p>
          </div>
        </div>

        {/* Time indicator */}
        <div className="absolute bottom-2 right-2 text-xs text-white/70 bg-black/50 px-2 py-1 rounded font-mono">
          {Math.floor(currentTime / 60).toString().padStart(2, '0')}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Controls */}
      <CardContent className="p-3 space-y-2">
        {/* Progress bar */}
        <div
          className="relative h-1 bg-muted rounded-full cursor-pointer group/progress"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            setCurrentTime(pct * duration)
          }}
        >
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full"
            style={{ width: `${(currentTime / duration) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${(currentTime / duration) * 100}%`, marginLeft: '-6px' }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentTime(0)}>
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentTime(duration)}>
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            {!isMuted && (
              <Slider value={[volume]} onValueChange={(v) => setVolume(v[0])} max={100} step={1} className="w-20" />
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
