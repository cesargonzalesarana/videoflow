'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { useTimelineStore } from '@/lib/timeline-store'
import { useRouter } from 'next/navigation'
import { Plus, FolderOpen, Trash2, Video, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Project {
  id: string
  name: string
  duration: number
  thumbnailUrl: string | null
  createdAt: string
  updatedAt: string
}

export function ProjectList() {
  const { setView, setCurrentProjectId } = useAppStore()
  const { setTracks } = useTimelineStore()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const createProject = async () => {
    setCreating(true)
    try {
      const name = `Proyecto ${new Date().toLocaleDateString('es-PE')}`
      const defaultTracks = [
        { id: 'track-1', name: 'Video 1', type: 'video', clips: [], muted: false, locked: false, visible: true },
        { id: 'track-2', name: 'Audio 1', type: 'audio', clips: [], muted: false, locked: false, visible: true },
        { id: 'track-3', name: 'Texto', type: 'text', clips: [], muted: false, locked: false, visible: true },
        { id: 'track-4', name: 'Imagenes', type: 'image', clips: [], muted: false, locked: false, visible: true },
      ]
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tracksJson: JSON.stringify(defaultTracks),
          duration: 300,
        }),
      })
      const data = await res.json()
      if (data.project) {
        setCurrentProjectId(data.project.id, data.project.name)
        setTracks(defaultTracks)
        setView('video-creator')
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setCreating(false)
    }
  }

  const openProject = async (project: Project) => {
    try {
      const res = await fetch(`/api/projects/${project.id}`)
      const data = await res.json()
      if (data.project) {
        const tracks = JSON.parse(data.project.tracksJson)
        setTracks(tracks)
        setCurrentProjectId(project.id, project.name)
        setView('video-creator')
      }
    } catch (error) {
      console.error('Error opening project:', error)
    }
  }

  const deleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Estas seguro de eliminar este proyecto?')) return
    try {
      await fetch(`/api/projects/${id}`, { method: 'DELETE' })
      fetchProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Video className="h-5 w-5 text-white" />
          </div>
          <p className="text-sm text-muted-foreground">Cargando proyectos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Mis Proyectos</h2>
          <p className="text-sm text-muted-foreground mt-1">Crea y gestiona tus proyectos de video</p>
        </div>
        <Button onClick={createProject} disabled={creating} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white">
          <Plus className="w-4 h-4 mr-2" />
          {creating ? 'Creando...' : 'Nuevo Proyecto'}
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed border-2 border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mb-4">
              <FolderOpen className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No tienes proyectos</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
              Crea tu primer proyecto para empezar a editar videos
            </p>
            <Button onClick={createProject} disabled={creating} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Crear Proyecto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id} className="group cursor-pointer hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/5" onClick={() => openProject(project)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center">
                      <Video className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">{Math.floor(project.duration)}s</p>
                    </div>
                  </div>
                  <button onClick={(e) => deleteProject(project.id, e)} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md hover:bg-red-500/10 flex items-center justify-center transition-all">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(project.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
