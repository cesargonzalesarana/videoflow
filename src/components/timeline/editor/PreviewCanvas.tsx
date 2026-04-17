'use client'

import { useTimelineStore } from '@/lib/timeline-store'
import { useRef, useEffect, useState, useCallback } from 'react'

export function PreviewCanvas() {
  const { tracks, currentTime, isPlaying, selectedClipId, updateClip } = useTimelineStore()
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [audioReady, setAudioReady] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

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

  // Selected clip for controls (prefer the one user selected)
  const allActive = [activeVideo, activeImage].filter(Boolean)
  const selectedActive = selectedClipId ? allActive.find((c) => c?.id === selectedClipId) : allActive[0]

  const scale = selectedActive?.scale ?? 1
  const posX = selectedActive?.posX ?? 0
  const posY = selectedActive?.posY ?? 0

  const updateSelectedProp = (updates: Record<string, unknown>) => {
    if (selectedActive) updateClip(selectedActive.id, updates)
  }

  const audioMuted = tracks.find((t) => t.type === 'audio')?.muted ?? false

  // Drag to position
  const handlePreviewDrag = useCallback((e: React.MouseEvent) => {
    if (!previewRef.current || !selectedActive) return
    const rect = previewRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 200
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 200
    updateClip(selectedActive.id, { posX: x, posY: y })
  }, [selectedActive, updateClip])

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
      <div
        ref={previewRef}
        className="relative w-full h-full max-w-[960px] max-h-[540px] bg-[#0a0a1a] mx-auto my-auto overflow-hidden cursor-crosshair"
        onMouseMove={(e) => { if (e.buttons === 1) handlePreviewDrag(e) }}
      >
        {/* Video layer (bottom) */}
        {activeVideo && activeVideo.src && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ opacity: activeVideo.opacity }}>
            <video
              ref={videoRef}
              className="w-full h-full object-contain pointer-events-none"
              style={{
                transform: `scale(${activeVideo.scale ?? 1}) translate(${activeVideo.posX ?? 0}%, ${activeVideo.posY ?? 0}%)`,
                transition: 'transform 0.05s',
              }}
              playsInline
              onLoadedData={() => {
                setVideoReady(true)
                if (isPlaying) {
                  const v = videoRef.current
                  if (v && activeVideo) { v.currentTime = currentTime - activeVideo.startTime; v.play().catch(() => {}) }
                }
              }}
              onCanPlay={() => setVideoReady(true)}
            />
          </div>
        )}

        {/* Image layer (on top of video) */}
        {activeImage && activeImage.src && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: activeImage.opacity }}>
            <img
              src={activeImage.src}
              alt={activeImage.name}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${activeImage.scale ?? 1}) translate(${activeImage.posX ?? 0}%, ${activeImage.posY ?? 0}%)`,
                transition: 'transform 0.05s',
                position: 'relative',
                zIndex: 10,
              }}
              draggable={false}
            />
          </div>
        )}

        {/* Text layer (top) */}
        {activeTexts.map((t) => (
          <div key={t.id} className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: t.opacity }}>
            <span
              style={{
                fontSize: `${(t.fontSize ?? 32) * (t.scale ?? 1)}px`,
                color: t.color ?? '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                transform: `translate(${t.posX ?? 0}%, ${t.posY ?? 0}%)`,
                transition: 'transform 0.05s',
                position: 'relative',
                zIndex: 20,
              }}
            >
              {t.text}
            </span>
          </div>
        ))}

        {/* Empty state */}
        {!activeVideo && !activeImage && activeTexts.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <svg className="w-16 h-16 text-gray-700 mb-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4h-4z" />
            </svg>
            <p className="text-gray-600 text-sm">Vista previa</p>
            <p className="text-gray-700 text-xs mt-1">Sube medios para comenzar</p>
          </div>
        )}

        {/* Controls */}
        {selectedActive && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-center gap-2 z-30">
            <div className="bg-black/80 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-3 border border-white/10">
              <span className="text-[10px] text-purple-400 font-medium truncate max-w-[80px]">
                {selectedActive.type === 'video' ? '🎬' : selectedActive.type === 'image' ? '🖼️' : '📝'} {selectedActive.name}
              </span>
              <span className="text-gray-600">|</span>
              <button onClick={() => updateSelectedProp({ scale: Math.max(0.1, scale - 0.1) })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white" title="Achicar">-</button>
              <span className="text-[10px] text-gray-300 w-10 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={() => updateSelectedProp({ scale: Math.min(3, scale + 0.1) })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs text-white" title="Agrandar">+</button>
              <span className="text-gray-600">|</span>
              <button onClick={() => updateSelectedProp({ posX: posX - 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">←</button>
              <button onClick={() => updateSelectedProp({ posX: posX + 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">→</button>
              <button onClick={() => updateSelectedProp({ posY: posY - 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">↑</button>
              <button onClick={() => updateSelectedProp({ posY: posY + 5 })} className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-xs">↓</button>
              <button onClick={() => updateSelectedProp({ scale: 1, posX: 0, posY: 0 })} className="text-[10px] text-purple-400 hover:text-purple-300 ml-1">↺ Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}