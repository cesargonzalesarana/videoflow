'use client'

import { useState, useRef, useEffect } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function ExportPanel({ isOpen, onClose }: Props) {
  const { tracks, isPlaying, setIsPlaying, setCurrentTime } = useTimelineStore()
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const videoElRef = useRef<HTMLVideoElement | null>(null)
  const imageElRef = useRef<HTMLImageElement | null>(null)

  const getProjectDuration = () => {
    let maxEnd = 0
    tracks.forEach((t) =>
      t.clips.forEach((c) => {
        const end = c.startTime + c.duration
        if (end > maxEnd) maxEnd = end
      })
    )
    return maxEnd || 5
  }

  const getTotalClips = () => tracks.reduce((sum, t) => sum + t.clips.length, 0)

  const startExport = async () => {
    if (getTotalClips() === 0) return
    setStatus('recording')
    setProgress(0)
    setDownloadUrl(null)
    onClose()

    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const duration = getProjectDuration()
    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 5000000,
    })
    chunksRef.current = []
    mediaRecorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      setDownloadUrl(url)
      setStatus('done')
      setProgress(100)
    }

    recorder.start()

    const videoTrack = tracks.find((t) => t.type === 'video')
    const imageTrack = tracks.find((t) => t.type === 'image')
    const textTrack = tracks.find((t) => t.type === 'text')
    const audioTrack = tracks.find((t) => t.type === 'audio')

    let videoEl: HTMLVideoElement | null = null
    let audioEl: HTMLAudioElement | null = null
    let imageEl: HTMLImageElement | null = null

    // Load first video
    if (videoTrack && videoTrack.clips.length > 0) {
      videoEl = document.createElement('video')
      videoEl.crossOrigin = 'anonymous'
      videoEl.muted = true
      videoEl.playsInline = true
      videoEl.src = videoTrack.clips[0].src
      videoEl.loop = false
      videoElRef.current = videoEl
      await new Promise<void>((resolve) => {
        videoEl!.onloadeddata = () => resolve()
        videoEl!.load()
      })
    }

    // Load first image
    if (imageTrack && imageTrack.clips.length > 0) {
      imageEl = document.createElement('img')
      imageEl.crossOrigin = 'anonymous'
      imageEl.src = imageTrack.clips[0].src!
      await new Promise<void>((resolve) => {
        imageEl!.onload = () => resolve()
      })
      imageElRef.current = imageEl
    }

    // Load audio
    if (audioTrack && audioTrack.clips.length > 0) {
      audioEl = document.createElement('audio')
      audioEl.src = audioTrack.clips[0].src
      audioEl.volume = audioTrack.clips[0].volume ?? 1
      audioEl.load()
    }

    const startTime = performance.now()
    const durationMs = duration * 1000

    const renderFrame = () => {
      const elapsed = performance.now() - startTime
      const currentSec = elapsed / 1000

      if (currentSec >= duration) {
        if (videoEl) videoEl.pause()
        if (audioEl) audioEl.pause()
        recorder.stop()
        return
      }

      setProgress(Math.min(Math.round((currentSec / duration) * 100), 99))

      ctx!.fillStyle = '#000000'
      ctx!.fillRect(0, 0, 1280, 720)

      const activeVideoClip = videoTrack?.clips.find(
        (c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration
      )
      const activeImageClip = imageTrack?.clips.find(
        (c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration
      )
      const activeTextClips = textTrack?.clips.filter(
        (c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration
      )

      // Draw video
      if (videoEl && activeVideoClip) {
        if (videoEl.paused) {
          videoEl.currentTime = currentSec - activeVideoClip.startTime
          videoEl.play().catch(() => {})
        }
        const s = activeVideoClip.scale ?? 1
        const px = (activeVideoClip.posX ?? 0) * 6.4
        const py = (activeVideoClip.posY ?? 0) * 3.6
        ctx!.globalAlpha = activeVideoClip.opacity ?? 1
        ctx!.save()
        ctx!.translate(640 + px, 360 + py)
        ctx!.scale(s, s)
        ctx!.drawImage(videoEl, -640, -360, 1280, 720)
        ctx!.restore()
        ctx!.globalAlpha = 1
      }

      // Draw image on top
      if (imageEl && activeImageClip) {
        const s = activeImageClip.scale ?? 1
        const px = (activeImageClip.posX ?? 0) * 6.4
        const py = (activeImageClip.posY ?? 0) * 3.6
        ctx!.globalAlpha = activeImageClip.opacity ?? 1
        ctx!.save()
        ctx!.translate(640 + px, 360 + py)
        ctx!.scale(s, s)
        const aspect = imageEl.naturalWidth / imageEl.naturalHeight
        let dw = 1280
        let dh = 720
        if (aspect > 1280 / 720) { dh = 1280 / aspect } else { dw = 720 * aspect }
        ctx!.drawImage(imageEl, -dw / 2, -dh / 2, dw, dh)
        ctx!.restore()
        ctx!.globalAlpha = 1
      }

      // Draw texts
      activeTextClips.forEach((t) => {
        ctx!.globalAlpha = t.opacity ?? 1
        ctx!.fillStyle = t.color ?? '#ffffff'
        ctx!.font = `bold ${(t.fontSize ?? 32) * (t.scale ?? 1) * 1.5}px Arial`
        ctx!.textAlign = 'center'
        ctx!.shadowColor = 'rgba(0,0,0,0.8)'
        ctx!.shadowBlur = 6
        ctx!.shadowOffsetX = 2
        ctx!.shadowOffsetY = 2
        const tx = 640 + (t.posX ?? 0) * 6.4
        const ty = 360 + (t.posY ?? 0) * 3.6
        ctx!.fillText(t.text ?? '', tx, ty)
        ctx!.shadowBlur = 0
        ctx!.globalAlpha = 1
      })

      requestAnimationFrame(renderFrame)
    }

    // Play audio and start rendering
    if (audioEl) {
      audioEl.currentTime = 0
      audioEl.play().catch(() => {})
    }
    requestAnimationFrame(renderFrame)
  }

  const download = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = 'videoflow-export.webm'
    a.click()
  }

  if (!isOpen && status === 'idle') return null

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {(isOpen || status === 'recording' || status === 'done') && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-6 w-[400px]">
            {status === 'idle' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Exportar Video</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Resolucion</span>
                    <span className="text-white">1280 x 720 (HD)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Formato</span>
                    <span className="text-white">WebM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Duracion</span>
                    <span className="text-white">{getProjectDuration().toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Clips</span>
                    <span className="text-white">{getTotalClips()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">
                    Cancelar
                  </button>
                  <button onClick={startExport} className="flex-1 py-2 rounded-lg bg-purple-600 text-white text-sm hover:bg-purple-500 transition-colors font-medium">
                    🎬 Exportar
                  </button>
                </div>
              </>
            )}

            {status === 'recording' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Exportando...</h3>
                <div className="mb-4">
                  <div className="w-full h-3 bg-[#2a2a4a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2 text-center">{progress}%</p>
                </div>
                <p className="text-xs text-gray-500 text-center">No cierres esta ventana mientras se exporta</p>
              </>
            )}

            {status === 'done' && (
              <>
                <h3 className="text-lg font-semibold mb-2 text-green-400">Exportacion completa</h3>
                <p className="text-sm text-gray-400 mb-6 text-center">Tu video esta listo para descargar</p>
                <div className="flex gap-2">
                  <button onClick={() => { setStatus('idle'); setDownloadUrl(null) }} className="flex-1 py-2 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">
                    Cerrar
                  </button>
                  <button onClick={download} className="flex-1 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500 transition-colors font-medium">
                    ⬇ Descargar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}