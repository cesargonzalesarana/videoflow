'use client'

import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

export type FFmpegStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'error'

export function useFFmpeg() {
  const ffmpegRef = useRef<FFmpeg | null>(null)
  const [status, setStatus] = useState<FFmpegStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    if (ffmpegRef.current && status === 'ready') return ffmpegRef.current

    setStatus('loading')
    setMessage('Cargando motor de video...')

    try {
      const ffmpeg = new FFmpeg()

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100))
      })

      ffmpeg.on('log', ({ message: msg }) => {
        console.log('[FFmpeg]', msg)
      })

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm'

      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })

      ffmpegRef.current = ffmpeg
      setStatus('ready')
      setMessage('')
      return ffmpeg
    } catch (error) {
      console.error('FFmpeg load error:', error)
      setStatus('error')
      setMessage('Error al cargar el motor de video')
      return null
    }
  }, [status])

  const writeFile = useCallback(async (ffmpeg: FFmpeg, fileName: string, file: File) => {
    const data = await fetchFile(file)
    await ffmpeg.writeFile(fileName, data)
  }, [])

  const readFileAsDataURL = useCallback(async (ffmpeg: FFmpeg, fileName: string) => {
    const data = await ffmpeg.readFile(fileName)
    if (data instanceof Uint8Array) {
      const blob = new Blob([data.buffer], { type: 'video/mp4' })
      return URL.createObjectURL(blob)
    }
    return ''
  }, [])

  const trimVideo = useCallback(async (
    ffmpeg: FFmpeg,
    inputFile: string,
    outputFile: string,
    startTime: number,
    duration: number
  ) => {
    setStatus('processing')
    setMessage('Recortando video...')
    setProgress(0)

    await ffmpeg.exec([
      '-ss', startTime.toString(),
      '-i', inputFile,
      '-t', duration.toString(),
      '-c', 'copy',
      outputFile
    ])
  }, [])

  const addTextOverlay = useCallback(async (
    ffmpeg: FFmpeg,
    inputFile: string,
    outputFile: string,
    text: string,
    position: 'top' | 'center' | 'bottom' = 'center',
    fontSize: number = 24,
    fontColor: string = 'white'
  ) => {
    setStatus('processing')
    setMessage('Agregando texto...')
    setProgress(0)

    const yPos = position === 'top' ? 'h/10' : position === 'bottom' ? 'h*9/10' : '(h-text_h)/2'
    const escapedText = text.replace(/'/g, "\\'").replace(/:/g, "\\:")

    await ffmpeg.exec([
      '-i', inputFile,
      '-vf', `drawtext=text='${escapedText}':fontsize=${fontSize}:fontcolor=${fontColor}:x=(w-text_w)/2:y=${yPos}:box=1:boxcolor=black@0.5:boxborderw=5`,
      '-c:a', 'copy',
      outputFile
    ])
  }, [])

  const concatVideos = useCallback(async (
    ffmpeg: FFmpeg,
    inputFiles: string[],
    outputFile: string
  ) => {
    setStatus('processing')
    setMessage('Uniendo clips...')
    setProgress(0)

    const concatList = inputFiles.map(f => `file '${f}'`).join('\n')
    const encoder = new TextEncoder()
    await ffmpeg.writeFile('concat.txt', encoder.encode(concatList))

    await ffmpeg.exec([
      '-f', 'concat',
      '-safe', '0',
      '-i', 'concat.txt',
      '-c', 'copy',
      outputFile
    ])

    await ffmpeg.deleteFile('concat.txt')
  }, [])

  const exportVideo = useCallback(async (
    ffmpeg: FFmpeg,
    outputFile: string
  ): Promise<string> => {
    setStatus('processing')
    setMessage('Exportando video final...')
    setProgress(0)

    const finalOutput = 'final_' + outputFile
    await ffmpeg.exec([
      '-i', outputFile,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      finalOutput
    ])

    const url = await readFileAsDataURL(ffmpeg, finalOutput)
    setProgress(100)
    setMessage('')
    setStatus('ready')
    return url
  }, [readFileAsDataURL])

  return {
    status,
    progress,
    message,
    load,
    writeFile,
    readFileAsDataURL,
    trimVideo,
    addTextOverlay,
    concatVideos,
    exportVideo,
  }
}