'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload, Search, Grid3X3, List, Trash2, Eye, Film, Image as ImageIcon,
  Music, Type, FolderOpen, Loader2, Check, AlertCircle, X, Download,
  Filter, HardDrive, MoreVertical, Clock, ArrowUpDown, FileVideo,
  FileImage, FileAudio
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface MediaFile {
  id: string
  name: string
  type: 'video' | 'audio' | 'image' | 'text'
  size: number
  createdAt: string
  storagePath: string
  previewUrl?: string
  duration?: number
  selected?: boolean
}

type SortOption = 'name-asc' | 'name-desc' | 'date-new' | 'date-old' | 'size-large' | 'size-small'
type ViewMode = 'grid' | 'list'

const typeIcons: Record<string, React.ReactNode> = {
  video: <Film className="h-5 w-5" />,
  audio: <Music className="h-5 w-5" />,
  image: <ImageIcon className="h-5 w-5" />,
  text: <Type className="h-5 w-5" />,
}

const typeGradients: Record<string, string> = {
  video: 'from-violet-500 to-purple-600',
  audio: 'from-emerald-500 to-green-600',
  image: 'from-pink-500 to-rose-600',
  text: 'from-amber-500 to-yellow-600',
}

const typeFileIcons: Record<string, React.ReactNode> = {
  video: <FileVideo className="h-8 w-8" />,
  audio: <FileAudio className="h-8 w-8" />,
  image: <FileImage className="h-8 w-8" />,
  text: <Type className="h-8 w-8" />,
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  var k = 1024
  var sizes = ['B', 'KB', 'MB', 'GB']
  var i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  var d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getTimeAgo(dateStr: string): string {
  var now = Date.now()
  var then = new Date(dateStr).getTime()
  var diff = now - then
  var mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return mins + 'm atras'
  var hrs = Math.floor(mins / 60)
  if (hrs < 24) return hrs + 'h atras'
  var days = Math.floor(hrs / 24)
  if (days < 30) return days + 'd atras'
  return formatDate(dateStr)
}

export function MediaLibrary() {
  const { setView } = useAppStore()
  const [files, setFiles] = useState<MediaFile[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [sortBy, setSortBy] = useState<SortOption>('date-new')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [loading, setLoading] = useState(true)
  const [storageUsed, setStorageUsed] = useState({ used: 0, limit: 500 })
  const [showSortMenu, setShowSortMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)

  useEffect(function() {
    fetchFiles()
  }, [])

  useEffect(function() {
    function handleClickOutside(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return function() { document.removeEventListener('mousedown', handleClickOutside) }
  }, [])

  async function fetchFiles() {
    setLoading(true)
    try {
      var res = await fetch('/api/upload')
      var data = await res.json()
      if (data.files) {
        var mapped = data.files.map(function(f: any, i: number) {
          return {
            id: f.id || 'file-' + i,
            name: f.name || f.storagePath?.split('/').pop() || 'Sin nombre',
            type: f.type || guessType(f.name || ''),
            size: f.size || 0,
            createdAt: f.createdAt || new Date().toISOString(),
            storagePath: f.storagePath || '',
            previewUrl: f.previewUrl,
            duration: f.duration,
          }
        })
        setFiles(mapped)
        var totalSize = mapped.reduce(function(sum: number, f: MediaFile) { return sum + f.size }, 0)
        setStorageUsed({ used: Math.round(totalSize / (1024 * 1024) * 10) / 10, limit: 500 })
      }
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Error al cargar archivos')
    } finally {
      setLoading(false)
    }
  }

  function guessType(name: string): 'video' | 'audio' | 'image' | 'text' {
    var ext = name.split('.').pop()?.toLowerCase() || ''
    var videoExts = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv']
    var audioExts = ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a', 'wma']
    var imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico']
    if (videoExts.includes(ext)) return 'video'
    if (audioExts.includes(ext)) return 'audio'
    if (imageExts.includes(ext)) return 'image'
    return 'image'
  }

  async function uploadFiles(fileList: FileList | File[]) {
    var filesToUpload = Array.from(fileList)
    if (filesToUpload.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    var uploaded = 0
    var newFiles: MediaFile[] = []

    for (var i = 0; i < filesToUpload.length; i++) {
      var file = filesToUpload[i]
      var type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : file.type.startsWith('image') ? 'image' : null
      if (!type) {
        uploaded++
        continue
      }

      try {
        var formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)
        var res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) throw new Error('Upload failed')

        var result = await res.json()
        var previewUrl = type === 'image' ? URL.createObjectURL(file) : undefined
        newFiles.push({
          id: 'file-' + Date.now() + '-' + i,
          name: file.name,
          type: type,
          size: file.size,
          createdAt: new Date().toISOString(),
          storagePath: result.path || '',
          previewUrl: previewUrl,
        })
      } catch (err) {
        toast.error('Error al subir ' + file.name)
      }
      uploaded++
      setUploadProgress(Math.round((uploaded / filesToUpload.length) * 100))
    }

    setFiles(function(prev) { return newFiles.concat(prev) })
    setIsUploading(false)
    setUploadProgress(0)
    if (newFiles.length > 0) {
      toast.success(newFiles.length + ' archivo(s) subido(s) correctamente')
      fetchFiles()
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  async function deleteFile(file: MediaFile) {
    try {
      setFiles(function(prev) { return prev.filter(function(f) { return f.id !== file.id }) })
      toast.success('"' + file.name + '" eliminado')
    } catch (error) {
      toast.error('Error al eliminar archivo')
    }
  }

  function openPreview(file: MediaFile) {
    setSelectedFile(file)
    setShowPreview(true)
  }

  function filteredAndSorted(): MediaFile[] {
    var result = files.filter(function(f) {
      if (activeFilter !== 'all' && f.type !== activeFilter) return false
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })

    result.sort(function(a, b) {
      switch (sortBy) {
        case 'name-asc': return a.name.localeCompare(b.name)
        case 'name-desc': return b.name.localeCompare(a.name)
        case 'date-new': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'date-old': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        case 'size-large': return b.size - a.size
        case 'size-small': return a.size - b.size
        default: return 0
      }
    })

    return result
  }

  var displayFiles = filteredAndSorted()
  var typeCounts = {
    all: files.length,
    video: files.filter(function(f) { return f.type === 'video' }).length,
    audio: files.filter(function(f) { return f.type === 'audio' }).length,
    image: files.filter(function(f) { return f.type === 'image' }).length,
    text: files.filter(function(f) { return f.type === 'text' }).length,
  }

  var storagePercent = Math.min((storageUsed.used / storageUsed.limit) * 100, 100)

  var filters = [
    { id: 'all', label: 'Todos', icon: <FolderOpen className="h-3.5 w-3.5" /> },
    { id: 'video', label: 'Videos', icon: <Film className="h-3.5 w-3.5" /> },
    { id: 'audio', label: 'Audio', icon: <Music className="h-3.5 w-3.5" /> },
    { id: 'image', label: 'Imagenes', icon: <ImageIcon className="h-3.5 w-3.5" /> },
    { id: 'text', label: 'Texto', icon: <Type className="h-3.5 w-3.5" /> },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Biblioteca de Medios</h1>
          <p className="text-sm text-muted-foreground">Gestiona todos tus archivos multimedia en un solo lugar</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={function() { if (fileInputRef.current) fileInputRef.current.click() }}
            className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Subir Archivos
          </Button>
          <Button
            variant="outline"
            onClick={function() { setView('video-creator') }}
          >
            <Film className="h-4 w-4 mr-2" />
            Ir al Editor
          </Button>
        </div>
      </div>

      {/* Storage indicator */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-purple-400" />
            <span className="text-sm font-medium">Almacenamiento</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {storageUsed.used} MB / {storageUsed.limit} MB
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={"h-full rounded-full " + (storagePercent > 90 ? "bg-gradient-to-r from-red-500 to-orange-500" : "bg-gradient-to-r from-purple-500 to-fuchsia-500")}
            initial={{ width: 0 }}
            animate={{ width: storagePercent + '%' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-muted-foreground">
            {files.length} archivo(s) en total
          </span>
          <span className="text-xs text-muted-foreground">
            {Math.round(storageUsed.limit - storageUsed.used)} MB disponibles
          </span>
        </div>
      </div>

      {/* Upload progress bar */}
      {isUploading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
            <span className="text-sm font-medium">Subiendo archivos...</span>
            <span className="text-sm text-muted-foreground ml-auto">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
              animate={{ width: uploadProgress + '%' }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>
      )}

      {/* Search, Filters and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar archivos por nombre..."
            value={searchQuery}
            onChange={function(e) { setSearchQuery(e.target.value) }}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <Button variant="outline" size="sm" onClick={function() { setShowSortMenu(!showSortMenu) }}>
              <ArrowUpDown className="h-4 w-4 mr-1" />
              Ordenar
            </Button>
            {showSortMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 glass rounded-lg border border-border/50 shadow-xl z-50 py-1">
                {[
                  { value: 'date-new' as SortOption, label: 'Mas recientes' },
                  { value: 'date-old' as SortOption, label: 'Mas antiguos' },
                  { value: 'name-asc' as SortOption, label: 'Nombre A-Z' },
                  { value: 'name-desc' as SortOption, label: 'Nombre Z-A' },
                  { value: 'size-large' as SortOption, label: 'Mayor tamano' },
                  { value: 'size-small' as SortOption, label: 'Menor tamano' },
                ].map(function(opt) {
                  return (
                    <button
                      key={opt.value}
                      onClick={function() { setSortBy(opt.value); setShowSortMenu(false) }}
                      className={"w-full text-left px-3 py-2 text-sm transition-colors " + (sortBy === opt.value ? "bg-purple-500/15 text-purple-300" : "hover:bg-muted/50 text-muted-foreground hover:text-foreground")}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border/50 p-0.5">
            <button
              onClick={function() { setViewMode('grid') }}
              className={"p-1.5 rounded-md transition-colors " + (viewMode === 'grid' ? "bg-purple-500/20 text-purple-300" : "text-muted-foreground hover:text-foreground")}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={function() { setViewMode('list') }}
              className={"p-1.5 rounded-md transition-colors " + (viewMode === 'list' ? "bg-purple-500/20 text-purple-300" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Type filter chips */}
      <div className="flex flex-wrap gap-2">
        {filters.map(function(f) {
          return (
            <button
              key={f.id}
              onClick={function() { setActiveFilter(f.id) }}
              className={"flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all " + (
                activeFilter === f.id
                  ? "bg-gradient-to-r from-purple-500/20 to-fuchsia-500/15 text-purple-300 border border-purple-500/30"
                  : "bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent"
              )}
            >
              {f.icon}
              {f.label}
              <Badge variant="secondary" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
                {typeCounts[f.id as keyof typeof typeCounts]}
              </Badge>
            </button>
          )
        })}
      </div>

      {/* Drop zone overlay */}
      <div
        className={"relative rounded-xl border-2 border-dashed transition-all " + (
          isDragOver ? "border-purple-400 bg-purple-500/5 scale-[1.01]" : "border-transparent"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Content area */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-purple-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Cargando biblioteca...</p>
            </div>
          </div>
        ) : displayFiles.length === 0 ? (
          <div
            className={"flex flex-col items-center justify-center py-20 px-6 rounded-xl transition-all cursor-pointer " + (isDragOver ? "bg-purple-500/5" : "")}
            onClick={function() { if (fileInputRef.current) fileInputRef.current.click() }}
          >
            <motion.div
              animate={isDragOver ? { scale: 1.05, y: -5 } : { scale: 1, y: 0 }}
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4"
            >
              <Upload className="h-10 w-10 text-purple-400" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">
              {files.length === 0 ? 'Tu biblioteca esta vacia' : 'Sin resultados'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
              {files.length === 0
                ? 'Arrastra archivos aqui o haz clic para subir tus primeros videos, imagenes o audio'
                : 'Prueba con otro termino de busqueda o cambia el filtro'
              }
            </p>
            {files.length === 0 && (
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Seleccionar Archivos
              </Button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-1">
            {displayFiles.map(function(file) {
              return (
                <motion.div
                  key={file.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group glass rounded-xl overflow-hidden hover:border-purple-500/30 transition-all cursor-pointer"
                  onClick={function() { openPreview(file) }}
                >
                  <div className={"aspect-video bg-gradient-to-br " + typeGradients[file.type] + " relative flex items-center justify-center overflow-hidden"}>
                    {file.type === 'image' && file.previewUrl ? (
                      <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white/60">{typeFileIcons[file.type]}</span>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="secondary" className="h-8 w-8" onClick={function(e) { e.stopPropagation(); openPreview(file) }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="secondary" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={function(e) { e.stopPropagation(); deleteFile(file) }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="text-[10px] bg-black/50 text-white/80 backdrop-blur-sm border-0">
                        {file.type.toUpperCase()}
                      </Badge>
                    </div>
                    {file.duration && (
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-white/70" />
                        <span className="text-[10px] text-white/80 bg-black/50 rounded px-1 backdrop-blur-sm">
                          {file.duration.toFixed(1)}s
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium truncate" title={file.name}>{file.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatFileSize(file.size)}</span>
                      <span className="text-[10px] text-muted-foreground">{getTimeAgo(file.createdAt)}</span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          /* List View */
          <div className="glass rounded-xl overflow-hidden">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-2 border-b border-border/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <span className="w-8"></span>
              <span>Nombre</span>
              <span className="w-20 text-center">Tipo</span>
              <span className="w-20 text-right">Tamano</span>
              <span className="w-28 text-right">Fecha</span>
              <span className="w-20 text-right">Acciones</span>
            </div>
            <ScrollArea className="max-h-[500px]">
              {displayFiles.map(function(file) {
                return (
                  <motion.div
                    key={file.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 items-center border-b border-border/30 last:border-0 hover:bg-muted/20 transition-colors cursor-pointer group"
                    onClick={function() { openPreview(file) }}
                  >
                    <div className={"w-8 h-8 rounded-lg bg-gradient-to-br " + typeGradients[file.type] + " flex items-center justify-center flex-shrink-0"}>
                      <span className="text-white/80 text-xs">{typeIcons[file.type]}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" title={file.name}>{file.name}</p>
                      <p className="text-xs text-muted-foreground">{file.storagePath}</p>
                    </div>
                    <div className="w-20 text-center">
                      <Badge variant="outline" className="text-xs">{file.type}</Badge>
                    </div>
                    <span className="w-20 text-right text-sm text-muted-foreground">{formatFileSize(file.size)}</span>
                    <span className="w-28 text-right text-sm text-muted-foreground">{formatDate(file.createdAt)}</span>
                    <div className="w-20 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={function(e) { e.stopPropagation(); openPreview(file) }}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300" onClick={function(e) { e.stopPropagation(); deleteFile(file) }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </motion.div>
                )
              })}
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={function() { setShowPreview(false); setSelectedFile(null) }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={function(e) { e.stopPropagation() }}
            >
              {/* Preview header */}
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className={"w-10 h-10 rounded-xl bg-gradient-to-br " + typeGradients[selectedFile.type] + " flex items-center justify-center"}>
                    <span className="text-white">{typeIcons[selectedFile.type]}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{selectedFile.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.type.toUpperCase()} &middot; {formatFileSize(selectedFile.size)} &middot; {formatDate(selectedFile.createdAt)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={function() { setShowPreview(false); setSelectedFile(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Preview content */}
              <div className="p-4">
                <div className="aspect-video rounded-xl bg-black/50 flex items-center justify-center overflow-hidden mb-4">
                  {selectedFile.type === 'image' && selectedFile.previewUrl ? (
                    <img src={selectedFile.previewUrl} alt={selectedFile.name} className="max-w-full max-h-full object-contain" />
                  ) : selectedFile.type === 'video' && selectedFile.previewUrl ? (
                    <video src={selectedFile.previewUrl} controls className="max-w-full max-h-full" />
                  ) : selectedFile.type === 'audio' ? (
                    <div className="text-center">
                      <Music className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                      {selectedFile.previewUrl && (
                        <audio src={selectedFile.previewUrl} controls className="w-full max-w-md" />
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <Type className="h-16 w-16 text-amber-400 mx-auto" />
                      <p className="text-sm text-muted-foreground mt-2">Contenido de texto</p>
                    </div>
                  )}
                </div>

                {/* File details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                    <p className="text-sm font-medium capitalize">{selectedFile.type}</p>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Tamano</p>
                    <p className="text-sm font-medium">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Duracion</p>
                    <p className="text-sm font-medium">{selectedFile.duration ? selectedFile.duration.toFixed(1) + 's' : 'N/A'}</p>
                  </div>
                  <div className="glass rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Subido</p>
                    <p className="text-sm font-medium">{formatDate(selectedFile.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Preview actions */}
              <div className="flex items-center justify-end gap-2 p-4 border-t border-border/50">
                <Button variant="outline" onClick={function() { setShowPreview(false); setSelectedFile(null) }}>
                  Cerrar
                </Button>
                <Button
                  onClick={function() {
                    setView('video-creator')
                    setShowPreview(false)
                    setSelectedFile(null)
                    toast.info('Archivo listo para usar en el editor')
                  }}
                  className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Usar en Editor
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,image/*,audio/*,.txt"
        className="hidden"
        onChange={function(e) { if (e.target.files) uploadFiles(e.target.files) }}
      />
    </div>
  )
}
