'use client'

import { toast } from 'sonner'

interface ClipData {
  id: string
  trackId: string
  type: string
  name: string
  startTime: number
  duration: number
  file?: File
  previewUrl?: string
  volume: number
  opacity: number
  scale: number
  positionX: number
  positionY: number
  text?: string
  fontSize?: number
  fontWeight?: string
  textColor?: string
  textAlign?: string
  filter?: string
}

export async function exportWithAudio(
  clips: ClipData[],
  audioEnabled: boolean,
  setProcessing: (val: boolean) => void,
  setProcessingProgress: (val: number) => void
) {
  if (clips.length === 0) {
    toast.error('No hay clips para exportar')
    return
  }

  setProcessing(true)
  setProcessingProgress(0)

  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1920
    canvas.height = 1080
    const ctx = canvas.getContext('2d')!

    const totalDuration = Math.max(...clips.map(c => c.startTime + c.duration), 5)
    const fps = 30
    const stream = canvas.captureStream(fps)

    let mimeType = 'video/webm;codecs=vp9,opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp9'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8'
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'

    const recorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: 5000000,
    })

    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `videoflow-export-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setProcessing(false)
      setProcessingProgress(100)
      toast.success('Video exportado correctamente')
    }

    // Load media elements
    const videoElements = new Map<string, HTMLVideoElement>()
    const imageElements = new Map<string, HTMLImageElement>()
    const audioElements = new Map<string, HTMLAudioElement>()

    const videoClips = clips.filter(c => c.type === 'video' && c.previewUrl)
    const imageClips = clips.filter(c => c.type === 'image' && c.previewUrl)
    const audioClips = clips.filter(c => c.type === 'audio' && c.previewUrl)

    // Load videos
    for (const clip of videoClips) {
      if (!clip.previewUrl) continue
      const video = document.createElement('video')
      video.src = clip.previewUrl
      video.muted = !audioEnabled
      video.playsInline = true
      video.preload = 'auto'
      video.crossOrigin = 'anonymous'
      await new Promise<void>((resolve) => {
        video.oncanplaythrough = () => resolve()
        video.onerror = () => resolve()
        video.load()
      })
      videoElements.set(clip.id, video)

      // Capture audio from video if enabled
      if (audioEnabled) {
        try {
          const audioCtx = new AudioContext()
          const source = audioCtx.createMediaElementSource(video)
          const dest = audioCtx.createMediaStreamDestination()
          source.connect(dest)
          dest.stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
            stream.addTrack(track)
          })
        } catch (e) {
          // Audio capture not possible
        }
      }
    }

    // Load images
    for (const clip of imageClips) {
      if (!clip.previewUrl) continue
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = clip.previewUrl
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => resolve()
      })
      imageElements.set(clip.id, img)
    }

    // Load audio
    for (const clip of audioClips) {
      if (!clip.previewUrl) continue
      const audio = document.createElement('audio')
      audio.src = clip.previewUrl
      audio.volume = (clip.volume || 100) / 100
      audio.preload = 'auto'
      audio.load()
      audioElements.set(clip.id, audio)

      if (audioEnabled) {
        try {
          const audioCtx = new AudioContext()
          const source = audioCtx.createMediaElementSource(audio)
          const dest = audioCtx.createMediaStreamDestination()
          source.connect(dest)
          source.connect(audioCtx.destination)
          dest.stream.getAudioTracks().forEach((track: MediaStreamTrack) => {
            stream.addTrack(track)
          })
        } catch (e) {
          // Audio capture not possible
        }
      }
    }

    recorder.start()

    // Start playback for all media
    videoElements.forEach(v => { v.currentTime = 0; v.play().catch(() => {}) })
    audioElements.forEach(a => { a.currentTime = 0; a.play().catch(() => {}) })

    const startTime = performance.now()
    const durationMs = totalDuration * 1000

    const getFilterCSS = (filter?: string): string => {
      switch (filter) {
        case 'grayscale': return 'grayscale(100%)'
        case 'sepia': return 'sepia(100%)'
        case 'blur': return 'blur(2px)'
        case 'brightness-up': return 'brightness(1.3)'
        case 'contrast-up': return 'contrast(1.3)'
        default: return 'none'
      }
    }

    const renderFrame = () => {
      const elapsed = performance.now() - startTime
      const currentSec = elapsed / 1000

      if (currentSec >= totalDuration) {
        videoElements.forEach(v => v.pause())
        audioElements.forEach(a => a.pause())
        recorder.stop()
        return
      }

      setProcessingProgress(Math.min(Math.round((currentSec / totalDuration) * 99), 99))

      // Clear canvas
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, 1920, 1080)

      // Get active clips at current time
      const activeClips = clips.filter(c => currentSec >= c.startTime && currentSec < c.startTime + c.duration)

      // Render images first (bottom layer)
      activeClips.filter(c => c.type === 'image').forEach(clip => {
        const img = imageElements.get(clip.id)
        if (!img || !img.complete) return
        const scale = (clip.scale || 100) / 100
        const px = ((clip.positionX || 50) - 50) * (1920 / 100)
        const py = ((clip.positionY || 50) - 50) * (1080 / 100)
        ctx.save()
        ctx.globalAlpha = (clip.opacity || 100) / 100
        ctx.filter = getFilterCSS(clip.filter)
        ctx.translate(960 + px, 540 + py)
        ctx.scale(scale, scale)
        const aspect = img.naturalWidth / img.naturalHeight
        let dw = 1920
        let dh = 1080
        if (aspect > 1920 / 1080) dh = 1920 / aspect
        else dw = 1080 * aspect
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
        ctx.restore()
      })

      // Render videos (middle layer)
      activeClips.filter(c => c.type === 'video').forEach(clip => {
        const vid = videoElements.get(clip.id)
        if (!vid || vid.readyState < 2) return
        const scale = (clip.scale || 100) / 100
        const px = ((clip.positionX || 50) - 50) * (1920 / 100)
        const py = ((clip.positionY || 50) - 50) * (1080 / 100)
        ctx.save()
        ctx.globalAlpha = (clip.opacity || 100) / 100
        ctx.filter = getFilterCSS(clip.filter)
        ctx.translate(960 + px, 540 + py)
        ctx.scale(scale, scale)
        ctx.drawImage(vid, -960, -540, 1920, 1080)
        ctx.restore()
      })

      // Render text (top layer)
      activeClips.filter(c => c.type === 'text' && c.text).forEach(clip => {
        ctx.save()
        ctx.globalAlpha = (clip.opacity || 100) / 100
        ctx.fillStyle = clip.textColor || '#ffffff'
        const scaleFactor = 1920 / 1280
        const fontSize = ((clip.fontSize || 32) * (clip.scale || 100) / 100) * 1.5 * scaleFactor
        ctx.font = `${clip.fontWeight || 'bold'} ${fontSize}px system-ui, sans-serif`
        ctx.textAlign = (clip.textAlign || 'center') as CanvasTextAlign
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 8 * scaleFactor
        ctx.shadowOffsetX = 2 * scaleFactor
        ctx.shadowOffsetY = 2 * scaleFactor
        const tx = 960 + ((clip.positionX || 50) - 50) * 19.2
        const ty = 540 + ((clip.positionY || 50) - 50) * 10.8
        ctx.fillText(clip.text!, tx, ty)
        ctx.restore()
      })

      requestAnimationFrame(renderFrame)
    }

    requestAnimationFrame(renderFrame)

  } catch (error) {
    console.error('Export error:', error)
    setProcessing(false)
    setProcessingProgress(0)
    toast.error('Error al exportar el video')
  }
}