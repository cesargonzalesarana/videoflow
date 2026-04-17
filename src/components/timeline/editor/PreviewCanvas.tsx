'use client'

import { useTimelineStore } from '@/lib/timeline-store'
import { useRef, useEffect, useState } from 'react'

export function PreviewCanvas() {
  const { tracks, currentTime, isPlaying, updateClip } = useTimelineStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const prevPlayingState = useRef(false)

  const activeVideo = tracks
    .find((t) => t.type === 'video')?.clips
    .find((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration)

  const activeAudio = tracks
    .find((t) => t.type === 'audio')?.clips
    .find((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration)

  const activeImage = tracks
    .find((t) => t.type === 'image')?.clips
    .find((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration)

  const activeTexts = tracks
    .find((t) => t.type === 'text')?.clips
    .filter((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration) || []

  const activeClip = activeVideo || activeImage
  const scale = activeClip?.scale ?? 1
  const posX = activeClip?.posX ?? 0
  const posY = activeClip?.posY ?? 0

  const updateActiveProp = (updates: Record<string, unknown>) => {
    if (activeClip) updateClip(activeClip.id, updates)
  }

  const audioMuted = tracks.find((t) => t.type === 'audio')?.muted ?? false

  // Load video when clip changes
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (activeVideo && activeVideo.src) {
      video.src = activeVideo.src
      video.load()
      setVideoReady(false)
    }
  }, [activeVideo?.id])

  // Load audio when clip changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (activeAudio && activeAudio.src) {
      audio.src = activeAudio.src
      audio.load()
      setAudioReady(false)
    }
  }, [activeAudio?.id])

  // Handle play/pause for video
  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeVideo) return

    if (isPlaying) {
      const clipTime = currentTime - activeVideo.startTime
      if (videoReady && video.paused) {
        video.currentTime = clipTime
        video.play().catch(() => {})
      }
    } else {
      video.pause()
    }
    prevPlayingState.current = isPlaying
  }, [isPlaying, videoReady, activeVideo?.id])

  // Handle play/pause for audio
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeAudio) return

    if (isPlaying) {
      const clipTime = currentTime - activeAudio.startTime
      if (audioReady && audio.paused) {
        audio.currentTime = clipTime
        audio.play().catch(() => {})
      }
    } else {
      audio.pause()
    }
  }, [isPlaying, audioReady, activeAudio?.id])

  return (
    <div className="h-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="relative w-full h-full max-w-[960px] max-h-[540px] bg-[#0a0a1a] mx-auto my-auto overflow-hidden">

        {activeVideo && activeVideo.src && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: activeVideo.opacity }}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain"
              style={{
                transform: `scale(${activeVideo.scale ?? 1}) translate(${activeVideo.posX ?? 0}%, ${activeVideo.posY ?? 0}%)`,
                transition: 'transform 0.1s',
              }}
              playsInline
              onLoadedData={() => {
                setVideoReady(true)
                if (isPlaying) {
                  const v = videoRef.current
                  if (v && activeVideo) {
                    v.currentTime = currentTime - activeVideo.startTime
                    v.play().catch(() => {})
                  }
                }
              }}
              onCanPlay={() => {
                setVideoReady(true)
              }}
            />
          </div>
        )}

        <audio
          ref={audioRef}
          style={{ volume: audioMuted ? 0 : (activeAudio?.volume ?? 1) }}
          onLoadedData={() => {
            setAudioReady(true)
            if (isPlaying) {
              const a = audioRef.current
              if (a && activeAudio) {
                a.currentTime = currentTime - activeAudio.startTime
                a.play().catch(() => {})
              }
            }
          }}
          onCanPlay={() => {
            setAudioReady(true)
          }}
        />

        {activeImage && activeImage.src && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: activeImage.opacity }}>
            <img
              src={activeImage.src}
              alt={activeImage.name}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${activeImage.scale ?? 1}) translate(${activeImage.posX ?? 0}%, ${activeImage.posY ?? 0}%)`,
                transition: 'transform 0.1s',
              }}
            />
          </div>
        )}

        {activeTexts.map((t) => (
          <div key={t.id} className="absolute inset-0 flex items-center justify-center" style={{ opacity: t.opacity }}>
            <span
              style={{
                fontSize: `${(t.fontSize ?? 32) * (t.scale ?? 1)}px`,
                color: t.color ?? '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                transform: `translate(${t.posX ?? 0}%, ${t.posY ?? 0}%)`,
                transition: 'transform 0.1s',
              }}
            >
              {t.text}
            </span>
          </div>
        ))}

        {!activeVideo && !activeImage && activeTexts.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-gray-700 mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <p className="text-gray-600 text-sm">Vista previa</p>
            <p className="text-gray-700 text-xs mt-1">Sube medios para comenzar</p>
          </div>
        )}

        {activeClip && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 z-30">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-3 border border-white/10">
              <button onClick={() => updateActiveProp({ scale: Math.max(0.1, scale - 0.1) })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white">-</button>
              <span className="text-[10px] text-gray-300 w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => updateActiveProp({ scale: Math.min(3, scale + 0.1) })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white">+</button>
              <span className="text-gray-600">|</span>
              <button onClick={() => updateActiveProp({ posX: posX - 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">←</button>
              <button onClick={() => updateActiveProp({ posX: posX + 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">→</button>
              <button onClick={() => updateActiveProp({ posY: posY - 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">↑</button>
              <button onClick={() => updateActiveProp({ posY: posY + 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">↓</button>
              <button onClick={() => updateActiveProp({ scale: 1, posX: 0, posY: 0 })} className="text-[10px] text-purple-400 hover:text-purple-300 ml-1">↺ Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}