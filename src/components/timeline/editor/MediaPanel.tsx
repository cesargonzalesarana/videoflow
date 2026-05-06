'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Upload, Film, Image as ImageIcon, Music, Type,
  Plus, FileVideo, Search, FolderOpen
} from 'lucide-react'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  type: 'video' | 'audio' | 'image' | 'text'
  name: string
  duration: number
  file?: File
  previewUrl?: string
  text?: string
}

export function MediaPanel() {
  const addClip = useTimelineStore((s) => s.addClip)
  const tracks = useTimelineStore((s) => s.tracks)
  const setSelectedClipId = useTimelineStore((s) => s.setSelectedClipId)
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddText, setShowAddText] = useState(false)
  const [newText, setNewText] = useState('')
  const [textDuration, setTextDuration] = useState(3)
  const [activeTab, setActiveTab] = useState<'all' | 'video' | 'audio' | 'image' | 'text'>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const processFiles = useCallback(
    (files: File[]) => {
      files.forEach((file) => {
        const type = file.type.startsWith('video')
          ? 'video'
          : file.type.startsWith('image')
          ? 'image'
          : file.type.startsWith('audio')
          ? 'audio'
          : null

        if (!type) return

        const previewUrl = URL.createObjectURL(file)
        const item: MediaItem = {
          id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: type as MediaItem['type'],
          name: file.name,
          duration: type === 'image' ? 3 : type === 'text' ? 3 : 5,
          file,
          previewUrl,
        }

        if (type === 'video') {
          const video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = () => {
            const dur = Math.round(video.duration * 10) / 10
            setMediaItems((prev) =>
              prev.map((m) => (m.id === item.id ? { ...m, duration: dur } : m))
            )
          }
          video.src = previewUrl
        }

        if (type === 'audio') {
          const audio = document.createElement('audio')
          audio.preload = 'metadata'
          audio.onloadedmetadata = () => {
            const dur = Math.round(audio.duration * 10) / 10
            setMediaItems((prev) =>
              prev.map((m) => (m.id === item.id ? { ...m, duration: dur } : m))
            )
          }
          audio.src = previewUrl
        }

        setMediaItems((prev) => [...prev, item])
        toast.success(`${file.name} importado`)
      })
    },
    []
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      processFiles(Array.from(e.dataTransfer.files))
    },
    [processFiles]
  )

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files))
  }

  const addTextToLibrary = () => {
    if (!newText.trim()) return
    const item: MediaItem = {
      id: `media_${Date.now()}_text`,
      type: 'text',
      name: newText.substring(0, 30),
      duration: textDuration,
      text: newText,
    }
    setMediaItems((prev) => [...prev, item])
    setNewText('')
    setShowAddText(false)
    toast.success('Texto anadido a la biblioteca')
  }

  const addToTimeline = (item: MediaItem) => {
    const matchingTracks = tracks.filter((t) => t.type === item.type)
    const targetTrack = matchingTracks.length > 0
      ? matchingTracks.reduce((best, track) => {
          const trackClips = useTimelineStore.getState().clips.filter((c) => c.trackId === track.id)
          const bestClips = useTimelineStore.getState().clips.filter((c) => c.trackId === best.id)
          return trackClips.length < bestClips.length ? track : best
        })
      : tracks[0]
    if (!targetTrack) {
      toast.error('No hay pistas disponibles')
      return
    }

    const existingClips = useTimelineStore
      .getState()
      .clips.filter((c) => c.trackId === targetTrack.id)
    const lastEnd = existingClips.reduce(
      (max, c) => Math.max(max, c.startTime + c.duration),
      0
    )

    const clipId = addClip({
      trackId: targetTrack.id,
      type: item.type,
      name: item.name,
      startTime: Math.round(lastEnd * 10) / 10,
      duration: item.duration,
      trimStart: 0,
      trimEnd: item.duration,
      file: item.file,
      previewUrl: item.previewUrl,
      text: item.text,
      volume: 100,
      opacity: 100,
      scale: 100,
      positionX: 50,
      positionY: 50,
      transition: 'none',
      filter: 'none',
    })
    toast.success(`"${item.name}" anadido al timeline`)
    setSelectedClipId(clipId)
  }

  const handleItemClick = (item: MediaItem) => {
    const state = useTimelineStore.getState()
    const existingClip = state.clips.find(
      (c) => c.name === item.name && c.type === item.type
    )
    if (existingClip) {
      setSelectedClipId(existingClip.id)
      toast.success(`"${item.name}" seleccionado`)
    } else {
      addToTimeline(item)
    }
  }

  const handleDragStart = (e: React.DragEvent, item: MediaItem) => {
    e.dataTransfer.setData(
      'application/clip-data',
      JSON.stringify({
        type: item.type,
        name: item.name,
        duration: item.duration,
        file: item.file ? item.name : undefined,
        previewUrl: item.previewUrl,
        text: item.text,
      })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  const filteredItems = mediaItems.filter((item) => {
    if (activeTab !== 'all' && item.type !== activeTab) return false
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  const typeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film className="h-3.5 w-3.5" />
      case 'audio': return <Music className="h-3.5 w-3.5" />
      case 'image': return <ImageIcon className="h-3.5 w-3.5" />
      case 'text': return <Type className="h-3.5 w-3.5" />
      default: return <FileVideo className="h-3.5 w-3.5" />
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'video': return 'from-violet-500 to-purple-500'
      case 'audio': return 'from-emerald-500 to-green-500'
      case 'image': return 'from-pink-500 to-rose-500'
      case 'text': return 'from-amber-500 to-yellow-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f] border-r border-white/5">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/80">Biblioteca de Medios</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-white/50 hover:text-white/80" onClick={() => setShowAddText(!showAddText)} title="Anadir texto">
            <Type className="h-3.5 w-3.5" />
          </Button>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-3 mb-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors shadow-lg shadow-violet-500/20"
        >
          <Upload className="h-4 w-4" />
          Subir Archivos
        </button>

        {showAddText && (
          <div className="space-y-2 mb-3 p-2 rounded-lg bg-white/5 border border-white/10">
            <Textarea placeholder="Escribe tu texto..." value={newText} onChange={(e) => setNewText(e.target.value)} className="min-h-[60px] h-auto text-xs bg-transparent border-white/10 text-white" rows={2} />
            <div className="flex items-center gap-2">
              <Input type="number" value={textDuration} onChange={(e) => setTextDuration(Number(e.target.value))} className="h-7 w-16 text-xs bg-transparent border-white/10 text-white" min={1} max={60} />
              <span className="text-[10px] text-white/40">segundos</span>
              <Button size="sm" onClick={addTextToLibrary} className="h-7 text-xs ml-auto bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white">
                <Plus className="h-3 w-3 mr-1" />
                Anadir
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input placeholder="Buscar medios..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-8 text-xs pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30" />
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {[
          { id: 'all', label: 'Todo' },
          { id: 'video', label: 'Video' },
          { id: 'audio', label: 'Audio' },
          { id: 'image', label: 'Imagen' },
          { id: 'text', label: 'Texto' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-300'
                : 'text-white/40 hover:text-white/60 hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1 min-h-[200px]" onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}>
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mx-auto mb-3">
                <FolderOpen className="h-5 w-5 text-white/20" />
              </div>
              <p className="text-xs text-white/30 mb-1">
                {mediaItems.length === 0 ? 'Sin medios aun' : 'Sin resultados'}
              </p>
              <p className="text-[10px] text-white/20">
                Arrastra archivos aqui o usa el boton subir
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => handleDragStart(e, item)}
                onClick={() => handleItemClick(item)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
              >
                <div className={`w-12 h-8 rounded flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br ${typeColor(item.type)}`}>
                  {item.type === 'image' && item.previewUrl ? (
                    <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white/80">{typeIcon(item.type)}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-white/70 truncate">{item.name}</p>
                  <p className="text-[9px] text-white/30">
                    {item.duration.toFixed(1)}s - {item.type.toUpperCase()}
                  </p>
                </div>

                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/40 hover:text-white hover:bg-white/10" onClick={(e) => { e.stopPropagation(); addToTimeline(item) }} title="Anadir al timeline">
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-white/5">
        <input ref={fileInputRef} type="file" multiple accept="video/*,image/*,audio/*" className="hidden" onChange={handleFileInput} />
      </div>
    </div>
  )
}