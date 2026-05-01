'use client'

import React, { useRef, useEffect, useState, useMemo } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize
} from 'lucide-react'

export function PreviewCanvas() {
  const currentTime = useTimelineStore((s) => s.currentTime) ?? 0
  const isPlaying = useTimelineStore((s) => s.isPlaying) ?? false
  const setIsPlaying = useTimelineStore((s) => s.setIsPlaying)
  const setCurrentTime = useTimelineStore((s) => s.setCurrentTime)
  const zoom = useTimelineStore((s) => s.zoom) ?? 80
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Safe clips and tracks
  const rawClips = useTimelineStore((s) => s.clips)
  const rawTracks = useTimelineStore((s) => s.tracks)

  const clips = useMemo(() => {
    if (!Array.isArray(rawClips)) return []
    return rawClips.filter((c): c is typeof rawClips[number] => c != null)
  }, [rawClips])

  const tracks = useMemo(() => {
    if (!Array.isArray(rawTracks)) return []
    return rawTracks.filter((t): t is typeof rawTracks[number] => t != null)
  }, [rawTracks])

  // Safe total duration
  const totalDuration = useMemo(() => {
    try {
      if (!clips || clips.length === 0) return 30
      const maxEnd = clips.reduce((max, c) => {
        const end = (c.startTime || 0) + (c.duration || 0)
        return Math.max(max, end)
      }, 0)
      return Math.max(30, maxEnd) + 5
    } catch {
      return 30
    }
  }, [clips])

  // Get active clips at current time
  const activeClips = useMemo(() => {
    try {
      return clips.filter(
        (c) => c && currentTime >= c.startTime && currentTime < c.startTime + c.duration
      )
    } catch {
      return []
    }
  }, [clips, currentTime])

  const sortedClips = useMemo(() => {
    try {
      return [...activeClips].sort((a, b) => {
        const order: Record<string, number> = { image: 0, video: 1, text: 2, audio: 3 }
        return (order[a?.type] || 0) - (order[b?.type] || 0)
      })
    } catch {
      return []
    }
  }, [activeClips])

  // Check track visibility
  const isTrackVisible = (trackId: string) => {
    try {
      const track = tracks.find((t) => t.id === trackId)
      return track ? track.visible && !track.muted : true
    } catch {
      return true
    }
  }

  // Get video filter CSS
  const getFilterCSS = (clip: typeof clips[0]) => {
    if (!clip) return 'none'
    switch (clip.filter) {
      case 'grayscale': return 'grayscale(100%)'
      case 'sepia': return 'sepia(100%)'
      case 'blur': return 'blur(2px)'
      case 'brightness-up': return 'brightness(1.3)'
      case 'contrast-up': return 'contrast(1.3)'
      default: return 'none'
    }
  }

  // Auto-play active video
  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(() => {})
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying])

  // Find active video clip and set its source
  const activeVideoClip = sortedClips.find(
    (c) => c && c.type === 'video' && isTrackVisible(c.trackId) && c.previewUrl
  )

  const formatTime = (seconds: number) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) seconds = 0
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 10)
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col bg-black rounded-lg overflow-hidden">
      {/* Preview area */}
      <div className="relative aspect-video bg-gradient-to-br from-[#0a0a1a] to-black flex items-center justify-center overflow-hidden">
        {/* Video layer */}
        {activeVideoClip && isTrackVisible(activeVideoClip.trackId) && (
          <video
            key={activeVideoClip.id}
            ref={videoRef}
            src={activeVideoClip.previewUrl}
            className="absolute inset-0 w-full h-full object-contain"
            style={{
              opacity: (activeVideoClip.opacity || 100) / 100,
              transform: `scale(${(activeVideoClip.scale || 100) / 100}) translate(${((activeVideoClip.positionX || 50) - 50) * 0.5}%, ${((activeVideoClip.positionY || 50) - 50) * 0.5}%)`,
              filter: getFilterCSS(activeVideoClip),
            }}
            muted={isMuted}
            playsInline
            loop
          />
        )}

        {/* Image layers */}
        {(sortedClips || [])
          .filter((c) => c && c.type === 'image' && c.previewUrl && isTrackVisible(c.trackId))
          .map((clip) => (
            <div
              key={clip.id}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                opacity: (clip.opacity || 100) / 100,
                filter: getFilterCSS(clip),
              }}
            >
              <img
                src={clip.previewUrl}
                alt={clip.name}
                className="max-w-full max-h-full object-contain"
                style={{
                  transform: `scale(${(clip.scale || 100) / 100})`,
                }}
              />
            </div>
          ))}

        {/* Text layers */}
        {(sortedClips || [])
          .filter((c) => c && c.type === 'text' && c.text && isTrackVisible(c.trackId))
          .map((clip) => (
            <div
              key={clip.id}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              style={{
                opacity: (clip.opacity || 100) / 100,
              }}
            >
              <p
                className="drop-shadow-lg max-w-[80%] break-words"
                style={{
                  fontSize: `${clip.fontSize || 32}px`,
                  fontWeight: clip.fontWeight || 'bold',
                  fontFamily: 'system-ui, sans-serif',
                  color: clip.textColor || '#ffffff',
                  textAlign: clip.textAlign || 'center' as React.CSSProperties['textAlign'],
                  textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                  transform: `translate(${((clip.positionX || 50) - 50) * 2}%, ${((clip.positionY || 50) - 50) * 2}%)`,
                }}
              >
                {clip.text}
              </p>
            </div>
          ))}

        {/* Empty state */}
        {(!sortedClips || sortedClips.length === 0) && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <p className="text-sm text-white/30">Vista previa</p>
            <p className="text-xs text-white/15 mt-1">Añade clips al timeline para ver el resultado</p>
          </div>
        )}

        {/* Time indicator */}
        <div className="absolute top-3 right-3 text-xs text-white/50 bg-black/60 px-2 py-1 rounded-md font-mono backdrop-blur-sm">
          {formatTime(currentTime)}
        </div>

        {/* Active clip indicator */}
        {sortedClips.filter((c) => c && c.type !== 'audio').length > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1">
            {sortedClips
              .filter((c) => c && c.type !== 'audio')
              .map((clip) => (
                <span
                  key={clip.id}
                  className="text-[9px] text-white/40 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-sm"
                >
                  {clip.name}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Controls bar */}
      <div className="bg-[#0a0a1f] px-3 py-2 space-y-2">
        {/* Progress scrubber */}
        <div
          className="relative h-1.5 bg-white/10 rounded-full cursor-pointer group/scrubber"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            setCurrentTime(pct * totalDuration)
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-75"
            style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/scrubber:opacity-100 transition-opacity"
            style={{
              left: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
              marginLeft: '-6px',
            }}
          />
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 1))}
            >
              <SkipBack className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-lg shadow-violet-500/20"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 ml-0.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/60 hover:text-white hover:bg-white/10"
              onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 1))}
            >
              <SkipForward className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-white/40 font-mono ml-2">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            {!isMuted && (
              <Slider
                value={[volume]}
                onValueChange={(v) => setVolume(v[0])}
                max={100}
                min={0}
                step={1}
                className="w-16"
              />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-3.5 w-3.5" /> : <Maximize className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
