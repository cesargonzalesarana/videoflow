'use client'

import React, { useState, useRef, useCallback } from 'react'
import { useTimelineStore, Clip } from '@/lib/timeline-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Upload, Film, Image as ImageIcon, Music, Type,
  Plus, Search, FolderOpen, Loader2, Check, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface MediaItem {
  id: string
  type: 'video' | 'audio' | 'image' | 'text'
  name: string
  duration: number
  file?: File
  previewUrl?: string
  storagePath?: string
  text?: string
  uploadStatus?: 'idle' | 'uploading' | 'done' | 'error'
  uploadProgress?: number
}

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

async function getSignedUrl(storagePath: string): Promise<string | null> {
  const cached = signedUrlCache.get(storagePath)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }
  try {
    const res = await fetch('/api/media?path=' + encodeURIComponent(storagePath))
    if (!res.ok) return null
    const data = await res.json()
    signedUrlCache.set(storagePath, { url: data.url, expiresAt: Date.now() + 3500000 })
    return data.url
  } catch {
    return null
  }
}

async function uploadToStorage(file: File, type: string): Promise<{ path: string } | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const err = await res.json().catch(function() { return { error: 'Error desconocido' } })
    throw new Error(err.error || 'Error al subir')
  }
  return await res.json()
}

export function MediaPanel() {
  const tracks = useTimelineStore(function(s) { return s.tracks })
  const addClip = useTimelineStore(function(s) { return s.addClip })
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddText, setShowAddText] = useState(false)
  const [newText, setNewText] = useState('')
  const [textDuration, setTextDuration] = useState(3)
  const [activeTab, setActiveTab] = useState<string>('all')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resolvePreviewUrl = useCallback(async function(item: MediaItem): Promise<string | undefined> {
    if (item.previewUrl) return item.previewUrl
    if (item.storagePath) {
      return (await getSignedUrl(item.storagePath)) || undefined
    }
    return undefined
  }, [])

  const processFiles = useCallback(
    function(files: File[]) {
      files.forEach(function(file) {
        var type = file.type.startsWith('video')
          ? 'video'
          : file.type.startsWith('image')
          ? 'image'
          : file.type.startsWith('audio')
          ? 'audio'
          : null
        if (!type) return

        var previewUrl = URL.createObjectURL(file)
        var itemId = 'media_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5)
        var item: MediaItem = {
          id: itemId,
          type: type as MediaItem['type'],
          name: file.name,
          duration: type === 'image' ? 3 : 5,
          file: file,
          previewUrl: previewUrl,
          uploadStatus: 'uploading',
          uploadProgress: 0,
        }

        if (type === 'video') {
          var video = document.createElement('video')
          video.preload = 'metadata'
          video.onloadedmetadata = function() {
            var dur = Math.round(video.duration * 10) / 10
            setMediaItems(function(prev) {
              return prev.map(function(m) { return m.id === item.id ? Object.assign({}, m, { duration: dur }) : m })
            })
          }
          video.src = previewUrl
        }

        if (type === 'audio') {
          var audio = document.createElement('audio')
          audio.preload = 'metadata'
          audio.onloadedmetadata = function() {
            var dur = Math.round(audio.duration * 10) / 10
            setMediaItems(function(prev) {
              return prev.map(function(m) { return m.id === item.id ? Object.assign({}, m, { duration: dur }) : m })
            })
          }
          audio.src = previewUrl
        }

        setMediaItems(function(prev) { return prev.concat([item]) })
        toast.success(file.name + ' importado')

        uploadToStorage(file, type)
          .then(function(result) {
            if (result) {
              setMediaItems(function(prev) {
                return prev.map(function(m) {
                  return m.id === itemId
                    ? Object.assign({}, m, { storagePath: result.path, uploadStatus: 'done' as const, uploadProgress: 100 })
                    : m
                })
              })
            }
          })
          .catch(function(err) {
            console.error('Upload failed:', err)
            setMediaItems(function(prev) {
              return prev.map(function(m) {
                return m.id === itemId ? Object.assign({}, m, { uploadStatus: 'error' as const }) : m
              })
            })
            toast.error('Error al subir ' + file.name + ': ' + err.message)
          })
      })
    },
    []
  )

  const handleDrop = useCallback(
    function(e: React.DragEvent) {
      e.preventDefault()
      processFiles(Array.from(e.dataTransfer.files))
    },
    [processFiles]
  )

  const handleFileInput = function(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) processFiles(Array.from(e.target.files))
  }

  const addTextToLibrary = function() {
    if (!newText.trim()) return
    var item: MediaItem = {
      id: 'media_' + Date.now() + '_text',
      type: 'text',
      name: newText.substring(0, 30),
      duration: textDuration,
      text: newText,
      uploadStatus: 'done',
    }
    setMediaItems(function(prev) { return prev.concat([item]) })
    setNewText('')
    setShowAddText(false)
    toast.success('Texto anadido a la biblioteca')
  }

  const addToTimeline = async function(item: MediaItem) {
    var targetTrack = tracks.find(function(t) { return t.type === item.type }) || tracks[0]
    if (!targetTrack) {
      toast.error('No hay pistas disponibles')
      return
    }
    var existingClips = targetTrack.clips || []
    var lastEnd = existingClips.reduce(function(max, c) { return Math.max(max, c.startTime + c.duration) }, 0)
    var src = item.previewUrl || (item.storagePath ? await getSignedUrl(item.storagePath) : undefined)

    var clip: Clip = {
      id: 'clip-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      trackId: targetTrack.id,
      type: item.type,
      name: item.name,
      startTime: Math.round(lastEnd * 10) / 10,
      duration: item.duration,
      src: src,
      text: item.text,
      volume: 100,
      opacity: 100,
    }

    addClip(targetTrack.id, clip)
    toast.success('"' + item.name + '" anadido al timeline')
  }

  const handleDragStart = function(e: React.DragEvent, item: MediaItem) {
    e.dataTransfer.setData(
      'application/clip-data',
      JSON.stringify({
        type: item.type,
        name: item.name,
        duration: item.duration,
        src: item.previewUrl,
        storagePath: item.storagePath,
        text: item.text,
      })
    )
    e.dataTransfer.effectAllowed = 'copy'
  }

  var filteredItems = mediaItems.filter(function(item) {
    if (activeTab !== 'all' && item.type !== activeTab) return false
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  var typeIcon = function(type: string) {
    switch (type) {
      case 'video': return React.createElement(Film, { className: 'h-3.5 w-3.5' })
      case 'audio': return React.createElement(Music, { className: 'h-3.5 w-3.5' })
      case 'image': return React.createElement(ImageIcon, { className: 'h-3.5 w-3.5' })
      case 'text': return React.createElement(Type, { className: 'h-3.5 w-3.5' })
      default: return null
    }
  }

  var typeColor = function(type: string) {
    switch (type) {
      case 'video': return 'from-violet-500 to-purple-500'
      case 'audio': return 'from-emerald-500 to-green-500'
      case 'image': return 'from-pink-500 to-rose-500'
      case 'text': return 'from-amber-500 to-yellow-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  var uploadStatusIcon = function(status?: string) {
    switch (status) {
      case 'uploading':
        return React.createElement(Loader2, { className: 'h-3 w-3 text-blue-400 animate-spin' })
      case 'done':
        return React.createElement(Check, { className: 'h-3 w-3 text-emerald-400' })
      case 'error':
        return React.createElement(AlertCircle, { className: 'h-3 w-3 text-red-400' })
      default:
        return null
    }
  }

  var uploadingCount = mediaItems.filter(function(m) { return m.uploadStatus === 'uploading' }).length

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f] border-r border-white/5">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white/80 flex items-center gap-2">
            Biblioteca de Medios
            {uploadingCount > 0 && (
              <Badge className="text-[9px] bg-blue-500/20 text-blue-300 border-blue-500/30 px-1.5">
                {uploadingCount} subiendo
              </Badge>
            )}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/50 hover:text-white/80"
              onClick={function() { setShowAddText(!showAddText) }}
              title="Agregar texto"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white/50 hover:text-white/80"
              onClick={function() { if (fileInputRef.current) fileInputRef.current.click() }}
              title="Subir archivo"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {showAddText && (
          <div className="space-y-2 mb-3 p-2 rounded-lg bg-white/5 border border-white/10">
            <Textarea
              placeholder="Escribe tu texto..."
              value={newText}
              onChange={function(e) { setNewText(e.target.value) }}
              className="min-h-[60px] h-auto text-xs bg-transparent border-white/10 text-white"
              rows={2}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={textDuration}
                onChange={function(e) { setTextDuration(Number(e.target.value)) }}
                className="h-7 w-16 text-xs bg-transparent border-white/10 text-white"
                min={1}
                max={60}
              />
              <span className="text-[10px] text-white/40">segundos</span>
              <Button
                size="sm"
                onClick={addTextToLibrary}
                className="h-7 text-xs ml-auto bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white"
              >
                <Plus className="h-3 w-3 mr-1" />
                Anadir
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
          <Input
            placeholder="Buscar medios..."
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value) }}
            className="h-8 text-xs pl-7 bg-white/5 border-white/10 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {[
          { id: 'all', label: 'Todo' },
          { id: 'video', label: 'Video' },
          { id: 'audio', label: 'Audio' },
          { id: 'image', label: 'Imagen' },
          { id: 'text', label: 'Texto' },
        ].map(function(tab) {
          return (
            <button
              key={tab.id}
              onClick={function() { setActiveTab(tab.id) }}
              className={"px-2 py-1 rounded text-[10px] font-medium transition-colors " + (
                activeTab === tab.id
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <ScrollArea className="flex-1">
        <div
          className="p-2 space-y-1 min-h-[200px]"
          onDrop={handleDrop}
          onDragOver={function(e) { e.preventDefault() }}
        >
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
            filteredItems.map(function(item) {
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={function(e) { handleDragStart(e, item) }}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 cursor-grab active:cursor-grabbing group transition-colors"
                >
                  <div className={"w-12 h-8 rounded flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br " + typeColor(item.type)}>
                    {item.type === 'image' && item.previewUrl ? (
                      <img src={item.previewUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/80">{typeIcon(item.type)}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-white/70 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[9px] text-white/30">
                        {item.duration.toFixed(1)}s - {item.type.toUpperCase()}
                      </p>
                      {item.type !== 'text' && (
                        <span className="flex items-center">{uploadStatusIcon(item.uploadStatus)}</span>
                      )}
                    </div>
                    {item.uploadStatus === 'uploading' && (
                      <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-300"
                          style={{ width: (item.uploadProgress || 50) + '%' }}
                        />
                      </div>
                    )}
                  </div>

                  {item.uploadStatus === 'error' && item.type !== 'text' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={function(e) {
                        e.stopPropagation()
                        if (item.file) {
                          setMediaItems(function(prev) {
                            return prev.map(function(m) {
                              return m.id === item.id ? Object.assign({}, m, { uploadStatus: 'uploading' as const }) : m
                            })
                          })
                          uploadToStorage(item.file!, item.type)
                            .then(function(result) {
                              if (result) {
                                setMediaItems(function(prev) {
                                  return prev.map(function(m) {
                                    return m.id === item.id
                                      ? Object.assign({}, m, { storagePath: result.path, uploadStatus: 'done' as const })
                                      : m
                                  })
                                })
                              }
                            })
                            .catch(function() {
                              setMediaItems(function(prev) {
                                return prev.map(function(m) {
                                  return m.id === item.id ? Object.assign({}, m, { uploadStatus: 'error' as const }) : m
                                })
                              })
                            })
                        }
                      }}
                      title="Reintentar subida"
                    >
                      <Upload className="h-3 w-3" />
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-white/40 hover:text-white hover:bg-white/10 transition-opacity"
                    onClick={function() { addToTimeline(item) }}
                    title="Agregar al timeline"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              )
            })
          )}
        </div>
      </ScrollArea>

      <div className="p-2 border-t border-white/5">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,image/*,audio/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    </div>
  )
}
