'use client'

import { useState, useRef } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'

interface Props {
  isOpen: boolean
  onClose: () => void
}

interface Format {
  id: string
  name: string
  platform: string
  icon: string
  width: number
  height: number
  fps: number
  bitrate: number
  maxDuration: number
  description: string
  color: string
}

const formats: Format[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    platform: 'youtube',
    icon: '\u25B6\uFE0F',
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 8000000,
    maxDuration: 600,
    description: 'Full HD 1080p, hasta 10 min',
    color: 'from-red-600 to-red-800',
  },
  {
    id: 'instagram-reel',
    name: 'Instagram Reels',
    platform: 'instagram',
    icon: '\uD83D\uDCF1',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrate: 5000000,
    maxDuration: 90,
    description: 'Vertical 9:16, hasta 90s',
    color: 'from-pink-600 to-purple-800',
  },
  {
    id: 'instagram-post',
    name: 'Instagram Post',
    platform: 'instagram',
    icon: '\uD83D\uDCF7',
    width: 1080,
    height: 1080,
    fps: 30,
    bitrate: 5000000,
    maxDuration: 60,
    description: 'Cuadrado 1:1, hasta 60s',
    color: 'from-pink-600 to-orange-500',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    platform: 'tiktok',
    icon: '\uD83C\uDFB5',
    width: 1080,
    height: 1920,
    fps: 30,
    bitrate: 5000000,
    maxDuration: 180,
    description: 'Vertical 9:16, hasta 3 min',
    color: 'from-gray-800 to-black',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    platform: 'facebook',
    icon: '\uD83D\uDC65',
    width: 1280,
    height: 720,
    fps: 30,
    bitrate: 5000000,
    maxDuration: 240,
    description: 'HD 720p, hasta 4 min',
    color: 'from-blue-600 to-blue-800',
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    platform: 'twitter',
    icon: '\uD83D\uDC26',
    width: 1280,
    height: 720,
    fps: 30,
    bitrate: 5000000,
    maxDuration: 140,
    description: 'HD 720p, hasta 2:20',
    color: 'from-gray-700 to-gray-900',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    platform: 'linkedin',
    icon: '\uD83D\uDCBC',
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 6000000,
    maxDuration: 600,
    description: 'Full HD 1080p, hasta 10 min',
    color: 'from-blue-700 to-blue-900',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Status',
    platform: 'whatsapp',
    icon: '\uD83D\uDCAC',
    width: 720,
    height: 1280,
    fps: 30,
    bitrate: 3000000,
    maxDuration: 30,
    description: 'Vertical 9:16, hasta 30s',
    color: 'from-green-600 to-green-800',
  },
  {
    id: 'custom',
    name: 'Personalizado',
    platform: 'custom',
    icon: '\u2699\uFE0F',
    width: 1280,
    height: 720,
    fps: 30,
    bitrate: 5000000,
    maxDuration: 600,
    description: 'Configura tu resolucion',
    color: 'from-purple-600 to-purple-800',
  },
]

export function ExportPanel({ isOpen, onClose }: Props) {
  const { tracks, isPlaying, setIsPlaying } = useTimelineStore()
  const [status, setStatus] = useState<'idle' | 'recording' | 'done'>('idle')
  const [progress, setProgress] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [selectedFormat, setSelectedFormat] = useState<Format>(formats[0])
  const [customWidth, setCustomWidth] = useState(1280)
  const [customHeight, setCustomHeight] = useState(720)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chunksRef = useRef<Blob[]>([])

  const getProjectDuration = () => {
    let maxEnd = 0
    tracks.forEach((t) => t.clips.forEach((c) => { const end = c.startTime + c.duration; if (end > maxEnd) maxEnd = end }))
    return maxEnd || 5
  }

  const getTotalClips = () => tracks.reduce((sum, t) => sum + t.clips.length, 0)

  const isDurationValid = () => getProjectDuration() <= selectedFormat.maxDuration

  const getEffectiveFormat = (): Format => {
    if (selectedFormat.id === 'custom') {
      return { ...selectedFormat, width: customWidth, height: customHeight }
    }
    return selectedFormat
  }

  const startExport = async () => {
    if (getTotalClips() === 0) return
    setStatus('recording')
    setProgress(0)
    setDownloadUrl(null)
    onClose()

    const format = getEffectiveFormat()
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = format.width
    canvas.height = format.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const duration = getProjectDuration()
    const stream = canvas.captureStream(format.fps)

    let mimeType = 'video/webm;codecs=vp9,opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: format.bitrate,
    })
    chunksRef.current = []

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

    const videoTrack = tracks.find((t) => t.type === 'video')
    const imageTrack = tracks.find((t) => t.type === 'image')
    const textTrack = tracks.find((t) => t.type === 'text')
    const audioTrack = tracks.find((t) => t.type === 'audio')

    let videoEl: HTMLVideoElement | null = null
    let audioEl: HTMLAudioElement | null = null
    let imageEl: HTMLImageElement | null = null

    if (videoTrack && videoTrack.clips.length > 0) {
      videoEl = document.createElement('video')
      videoEl.crossOrigin = 'anonymous'
      videoEl.muted = false
      videoEl.playsInline = true
      videoEl.preload = 'auto'
      videoEl.src = videoTrack.clips[0].src
      videoEl.loop = false
      await new Promise<void>((resolve, reject) => {
        videoEl!.oncanplaythrough = () => resolve()
        videoEl!.onerror = () => reject(new Error('No se pudo cargar el video'))
        videoEl!.load()
      })

      try {
        const aCtx = new AudioContext()
        if (aCtx.state === 'suspended') await aCtx.resume()
        const aSrc = aCtx.createMediaElementSource(videoEl)
        const aDest = aCtx.createMediaStreamDestination()
        aSrc.connect(aDest)
        aDest.stream.getAudioTracks().forEach((t: MediaStreamTrack) => stream.addTrack(t))
      } catch (e) {
        console.warn('Audio capture failed, exporting without audio')
      }

      await videoEl.play()
    }

    if (imageTrack && imageTrack.clips.length > 0) {
      imageEl = document.createElement('img')
      imageEl.crossOrigin = 'anonymous'
      imageEl.src = imageTrack.clips[0].src!
      await new Promise<void>((resolve) => { imageEl!.onload = () => resolve() })
    }

    if (audioTrack && audioTrack.clips.length > 0) {
      audioEl = document.createElement('audio')
      audioEl.src = audioTrack.clips[0].src
      audioEl.volume = audioTrack.clips[0].volume ?? 1
      audioEl.load()
    }

    recorder.start()

    const startTime = performance.now()
    const durationMs = duration * 1000
    const w = format.width
    const h = format.height

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
      ctx!.fillRect(0, 0, w, h)

      const activeVideoClip = videoTrack?.clips.find((c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration)
      const activeImageClip = imageTrack?.clips.find((c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration)
      const activeTextClips = textTrack?.clips.filter((c) => currentSec >= c.startTime && currentSec < c.startTime + c.duration)

      if (videoEl && activeVideoClip && videoEl.readyState >= 2) {
        const s = activeVideoClip.scale ?? 1
        const px = (activeVideoClip.posX ?? 0) * (w / 200)
        const py = (activeVideoClip.posY ?? 0) * (h / 200)
        ctx!.globalAlpha = activeVideoClip.opacity ?? 1
        ctx!.save()
        ctx!.translate(w / 2 + px, h / 2 + py)
        ctx!.scale(s, s)
        ctx!.drawImage(videoEl, -w / 2, -h / 2, w, h)
        ctx!.restore()
        ctx!.globalAlpha = 1
      }

      if (imageEl && activeImageClip) {
        const s = activeImageClip.scale ?? 1
        const px = (activeImageClip.posX ?? 0) * (w / 200)
        const py = (activeImageClip.posY ?? 0) * (h / 200)
        ctx!.globalAlpha = activeImageClip.opacity ?? 1
        ctx!.save()
        ctx!.translate(w / 2 + px, h / 2 + py)
        ctx!.scale(s, s)
        const aspect = imageEl.naturalWidth / imageEl.naturalHeight
        let dw = w
        let dh = h
        if (aspect > w / h) { dh = w / aspect } else { dw = h * aspect }
        ctx!.drawImage(imageEl, -dw / 2, -dh / 2, dw, dh)
        ctx!.restore()
        ctx!.globalAlpha = 1
      }

      activeTextClips.forEach((t) => {
        ctx!.globalAlpha = t.opacity ?? 1
        ctx!.fillStyle = t.color ?? '#ffffff'
        const scaleFactor = w / 1280
        ctx!.font = `bold ${(t.fontSize ?? 32) * (t.scale ?? 1) * 1.5 * scaleFactor}px Arial`
        ctx!.textAlign = 'center'
        ctx!.shadowColor = 'rgba(0,0,0,0.8)'
        ctx!.shadowBlur = 6 * scaleFactor
        ctx!.shadowOffsetX = 2 * scaleFactor
        ctx!.shadowOffsetY = 2 * scaleFactor
        const tx = w / 2 + (t.posX ?? 0) * (w / 200)
        const ty = h / 2 + (t.posY ?? 0) * (h / 200)
        ctx!.fillText(t.text ?? '', tx, ty)
        ctx!.shadowBlur = 0
        ctx!.globalAlpha = 1
      })

      requestAnimationFrame(renderFrame)
    }

    if (audioEl) { audioEl.currentTime = 0; audioEl.play().catch(() => {}) }
    requestAnimationFrame(renderFrame)
  }

  const download = () => {
    if (!downloadUrl) return
    const a = document.createElement('a')
    a.href = downloadUrl
    const format = getEffectiveFormat()
    a.download = `videoflow-${format.id}-${format.width}x${format.height}.webm`
    a.click()
  }

  if (!isOpen && status === 'idle') return null

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {(isOpen || status === 'recording' || status === 'done') && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a4a] p-6 w-full max-w-[550px] max-h-[90vh] overflow-y-auto">
            {status === 'idle' && (
              <>
                <h3 className="text-lg font-semibold mb-1">Exportar Video</h3>
                <p className="text-xs text-gray-500 mb-4">Selecciona el formato para tu red social</p>

                {/* Format grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {formats.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFormat(f)}
                      className={`p-2.5 rounded-lg border transition-all text-left ${
                        selectedFormat.id === f.id
                          ? 'border-purple-500 bg-purple-500/10 ring-1 ring-purple-500'
                          : 'border-[#2a2a4a] bg-[#12122a] hover:border-gray-500'
                      }`}
                    >
                      <span className="text-lg">{f.icon}</span>
                      <p className="text-[11px] font-medium text-white mt-1 truncate">{f.name}</p>
                      <p className="text-[9px] text-gray-500">{f.width}x{f.height}</p>
                    </button>
                  ))}
                </div>

                {/* Custom dimensions */}
                {selectedFormat.id === 'custom' && (
                  <div className="flex gap-2 mb-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Ancho (px)</label>
                      <input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase">Alto (px)</label>
                      <input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Format details */}
                <div className="bg-[#12122a] rounded-lg p-3 mb-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{selectedFormat.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedFormat.name}</p>
                      <p className="text-[10px] text-gray-400">{selectedFormat.description}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Resolucion</span>
                      <span className="text-white">{selectedFormat.width} x {selectedFormat.height}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">FPS</span>
                      <span className="text-white">{selectedFormat.fps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duracion max</span>
                      <span className="text-white">{Math.floor(selectedFormat.maxDuration / 60)}:{(selectedFormat.maxDuration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tu video</span>
                      <span className={isDurationValid() ? 'text-green-400' : 'text-red-400'}>
                        {getProjectDuration().toFixed(1)}s
                        {!isDurationValid() && ' (excede)'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Clips</span>
                      <span className="text-white">{getTotalClips()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Formato</span>
                      <span className="text-white">WebM (VP9 + Audio)</span>
                    </div>
                  </div>
                </div>

                {/* Aspect ratio preview */}
                <div className="flex items-center justify-center mb-4">
                  <div className={`w-16 h-16 rounded-lg bg-gradient-to-br ${selectedFormat.color} flex items-center justify-center text-2xl shadow-lg`} />
                  <div className="ml-3">
                    <p className="text-[11px] text-gray-400">
                      Aspecto: {selectedFormat.width / selectedFormat.height > 1 ? 'Horizontal' : selectedFormat.width / selectedFormat.height < 1 ? 'Vertical' : 'Cuadrado'}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {selectedFormat.width}:{selectedFormat.height}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">
                    Cancelar
                  </button>
                  <button
                    onClick={startExport}
                    disabled={!isDurationValid() || getTotalClips() === 0}
                    className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
                      !isDurationValid() || getTotalClips() === 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500'
                    }`}
                  >
                    Exportar
                  </button>
                </div>
              </>
            )}

            {status === 'recording' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Exportando para {selectedFormat.name}...</h3>
                <div className="flex items-center justify-center mb-4">
                  <span className="text-4xl">{selectedFormat.icon}</span>
                </div>
                <div className="mb-4">
                  <div className="w-full h-3 bg-[#2a2a4a] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-2 text-center">{progress}%</p>
                </div>
                <p className="text-xs text-gray-500 text-center">{selectedFormat.width}x{selectedFormat.height} - No cierres esta ventana</p>
              </>
            )}

            {status === 'done' && (
              <>
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold mt-2 text-green-400">Exportacion completa</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {selectedFormat.icon} {selectedFormat.name} ({selectedFormat.width}x{selectedFormat.height})
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setStatus('idle'); setDownloadUrl(null) }} className="flex-1 py-2.5 rounded-lg bg-[#2a2a4a] text-gray-300 text-sm hover:bg-[#3a3a5a] transition-colors">
                    Cerrar
                  </button>
                  <button onClick={download} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500 transition-colors font-medium">
                    Descargar
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
