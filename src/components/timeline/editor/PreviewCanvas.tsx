'use client'

import { useTimelineStore } from '@/lib/timeline-store'

export function PreviewCanvas() {
  const { tracks, currentTime } = useTimelineStore()

  const activeVideo = tracks
    .find((t) => t.type === 'video')?.clips
    .find((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration)

  const activeImage = tracks
    .find((t) => t.type === 'image')?.clips
    .find((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration)

  const activeTexts = tracks
    .find((t) => t.type === 'text')?.clips
    .filter((c) => currentTime >= c.startTime && currentTime < c.startTime + c.duration) || []

  return (
    <div className="h-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="relative w-full h-full max-w-[960px] max-h-[540px] bg-[#0a0a1a] mx-auto my-auto">
        {activeVideo && activeVideo.src && (
          <video
            key={activeVideo.id}
            src={activeVideo.src}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ opacity: activeVideo.opacity }}
            autoPlay
            muted={tracks.find((t) => t.type === 'audio')?.muted}
          />
        )}

        {activeImage && activeImage.src && (
          <img
            src={activeImage.src}
            alt={activeImage.name}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ opacity: activeImage.opacity }}
          />
        )}

        {activeTexts.map((t) => (
          <div
            key={t.id}
            className="absolute inset-0 flex items-center justify-center"
            style={{ opacity: t.opacity }}
          >
            <span
              style={{
                fontSize: `${t.fontSize ?? 32}px`,
                color: t.color ?? '#ffffff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
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
      </div>
    </div>
  )
}