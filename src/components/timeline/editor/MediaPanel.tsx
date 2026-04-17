'use client'

import { useRef } from 'react'
import { useTimelineStore, Clip } from '@/lib/timeline-store'

export function MediaPanel() {
  const { tracks, addClip } = useTimelineStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const url = URL.createObjectURL(file)
      const type = file.type.startsWith('video')
        ? 'video' as const
        : file.type.startsWith('audio')
        ? 'audio' as const
        : file.type.startsWith('image')
        ? 'image' as const
        : 'video' as const

      const targetTrack = tracks.find((t) => t.type === type) || tracks[0]
      const lastClipEnd = targetTrack.clips.reduce(
        (max, c) => Math.max(max, c.startTime + c.duration),
        0
      )

      const clip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        trackId: targetTrack.id,
        type,
        name: file.name,
        src: url,
        startTime: lastClipEnd,
        duration: type === 'image' ? 5 : 10,
        volume: type === 'audio' ? 1 : undefined,
        opacity: 1,
      }

      addClip(targetTrack.id, clip)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddText = () => {
    const textTrack = tracks.find((t) => t.type === 'text') || tracks[2]
    const lastClipEnd = textTrack.clips.reduce(
      (max, c) => Math.max(max, c.startTime + c.duration),
      0
    )

    const clip: Clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      trackId: textTrack.id,
      type: 'text',
      name: 'Texto',
      startTime: lastClipEnd,
      duration: 5,
      text: 'Tu texto aquí',
      fontSize: 32,
      color: '#ffffff',
    }

    addClip(textTrack.id, clip)
  }

  return (
    <div className="w-56 flex-shrink-0 bg-[#16162a] border-r border-[#2a2a4a] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[#2a2a4a]">
        <h2 className="text-sm font-semibold text-gray-200">Medios</h2>
      </div>
      <div className="p-3 flex flex-col gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Subir archivo
        </button>
        <button
          onClick={handleAddText}
          className="w-full py-2 px-3 rounded-lg bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Agregar texto
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,audio/*,image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Formatos aceptados</p>
        <div className="space-y-1">
          <p className="text-[10px] text-gray-400">🎬 Video: MP4, WebM, MOV</p>
          <p className="text-[10px] text-gray-400">🔊 Audio: MP3, WAV, OGG</p>
          <p className="text-[10px] text-gray-400">🖼️ Imagen: JPG, PNG, GIF</p>
        </div>
        <div className="mt-4 border-t border-[#2a2a4a] pt-3">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Clips en timeline</p>
          {tracks.flatMap((t) => t.clips).length === 0 ? (
            <p className="text-[10px] text-gray-600 italic">No hay clips aún</p>
          ) : (
            <div className="space-y-1">
              {tracks.flatMap((t) =>
                t.clips.map((c) => (
                  <div key={c.id} className="text-[10px] text-gray-400 truncate">
                    <span className="mr-1">
                      {c.type === 'video' ? '🎬' : c.type === 'audio' ? '🔊' : c.type === 'image' ? '🖼️' : '📝'}
                    </span>
                    {c.name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}