import { toast } from 'sonner'

interface Clip {
  id: string
  type: string
  file?: File
  text?: string
  previewUrl?: string
  startTime: number
  duration: number
  trimStart?: number
  scale?: number
  opacity?: number
  positionX?: number
  positionY?: number
  fontSize?: number
  textColor?: string
}

export async function exportWithAudio(
  clips: Clip[],
  exportWithAudio: boolean,
  setProcessing: (v: boolean) => void,
  setProcessingProgress: (v: number) => void
) {
  const videoClips = clips.filter((c) => c.type === 'video' && c.file)
  if (videoClips.length === 0) {
    toast.error('Agrega al menos un video para exportar')
    return
  }
  setProcessing(true)
  setProcessingProgress(0)
  try {
    const clip = videoClips[0]
    const objectUrl = URL.createObjectURL(clip.file!)
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const ctx = canvas.getContext('2d')!
    const video = document.createElement('video')
    video.src = objectUrl
    video.playsInline = true
    video.preload = 'auto'
    video.crossOrigin = 'anonymous'

    setProcessingProgress(5)
    await new Promise<void>((resolve, reject) => {
      video.oncanplaythrough = () => resolve()
      video.onerror = () => reject(new Error('No se pudo cargar el video'))
      video.load()
    })

    setProcessingProgress(10)

    let audioCtx: AudioContext | null = null
    let audioDest: MediaStreamAudioDestinationNode | null = null
    if (exportWithAudio) {
      try {
        audioCtx = new AudioContext()
        if (audioCtx.state === 'suspended') await audioCtx.resume()
        const source = audioCtx.createMediaElementSource(video)
        audioDest = audioCtx.createMediaStreamDestination()
        source.connect(audioDest)
      } catch (e) {
        console.warn('Audio no disponible, exportando sin audio')
      }
    }

    const textClips = clips.filter((c) => c.type === 'text' && c.text)
    const imageClips = clips.filter((c) => c.type === 'image' && c.previewUrl)
    const loadedImages: { clip: typeof imageClips[0]; img: HTMLImageElement }[] = []
    for (const ic of imageClips) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = ic.previewUrl!
        await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res() })
        loadedImages.push({ clip: ic, img })
      } catch { /* skip */ }
    }

    setProcessingProgress(15)
    const canvasStream = canvas.captureStream(30)
    const streamTracks = [...canvasStream.getVideoTracks()]
    if (exportWithAudio && audioDest) {
      streamTracks.push(...audioDest.stream.getAudioTracks())
    }
    const combinedStream = new MediaStream(streamTracks)

    let mimeType = 'video/webm;codecs=vp9,opus'
    if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm;codecs=vp8,opus'
    if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'

    const recorder = new MediaRecorder(combinedStream, { mimeType, videoBitsPerSecond: 5000000 })
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'videoflow_export' + (exportWithAudio ? '' : '_sin_audio') + '.webm'
      a.click()
      URL.revokeObjectURL(url)
      URL.revokeObjectURL(objectUrl)
    }

    recorder.start(200)
    setProcessingProgress(20)

    const trimStart = clip.trimStart || 0
    const exportDuration = clip.duration
    video.currentTime = trimStart
    await video.play()
    setProcessingProgress(25)

    const renderFrame = () => {
      if (video.paused || video.ended || video.currentTime >= trimStart + exportDuration) {
        video.pause()
        if (recorder.state !== 'inactive') recorder.stop()
        if (audioCtx) audioCtx.close()
        setProcessingProgress(100)
        toast.success('Video exportado ' + (exportWithAudio ? 'con' : 'sin') + ' audio!')
        setProcessing(false)
        return
      }
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      if (video.readyState >= 2) {
        const vw = video.videoWidth || canvas.width
        const vh = video.videoHeight || canvas.height
        const scale = Math.min(canvas.width / vw, canvas.height / vh)
        const dw = vw * scale
        const dh = vh * scale
        ctx.drawImage(video, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh)
      }

      const t = video.currentTime
      loadedImages.forEach(({ clip: ic, img }) => {
        if (t >= ic.startTime && t < ic.startTime + ic.duration) {
          const s = (ic.scale || 100) / 100
          const iw = img.naturalWidth * s * (canvas.height / img.naturalHeight)
          const ih = canvas.height * s
          ctx.globalAlpha = (ic.opacity || 100) / 100
          ctx.drawImage(img, ((ic.positionX || 50) / 100) * canvas.width - iw / 2, ((ic.positionY || 50) / 100) * canvas.height - ih / 2, iw, ih)
          ctx.globalAlpha = 1
        }
      })

      textClips.filter((c) => c.text && t >= c.startTime && t < c.startTime + c.duration).forEach((tc) => {
        const fs = ((tc.fontSize || 32) / 720) * canvas.height
        ctx.font = 'bold ' + fs + 'px system-ui, sans-serif'
        ctx.fillStyle = tc.textColor || '#ffffff'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.8)'
        ctx.shadowBlur = 8
        ctx.fillText(tc.text || '', ((tc.positionX || 50) / 100) * canvas.width, ((tc.positionY || 50) / 100) * canvas.height)
        ctx.shadowBlur = 0
        ctx.shadowColor = 'transparent'
      })

      const elapsed = video.currentTime - trimStart
      setProcessingProgress(Math.min(95, Math.round(25 + (elapsed / exportDuration) * 70)))
      requestAnimationFrame(renderFrame)
    }
    requestAnimationFrame(renderFrame)
  } catch (error) {
    console.error('Export error:', error)
    toast.error('Error al exportar. Intenta de nuevo.')
    setProcessing(false)
  }
}
