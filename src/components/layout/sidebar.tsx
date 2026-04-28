'use client'

import { useState, useEffect } from 'react'
import { useAppStore, type SidebarSection } from '@/lib/store'
import { cn } from '@/lib/utils'
import { Video, Calendar, Sparkles, Settings, LayoutDashboard, Flame, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

interface SidebarItem {
  id: SidebarSection
  label: string
  icon: React.ReactNode
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: 'video-creator', label: 'Crear Video', icon: <Video className="h-5 w-5" /> },
  { id: 'scheduler', label: 'Programar', icon: <Calendar className="h-5 w-5" /> },
  { id: 'ai-trends', label: 'IA Trends', icon: <Flame className="h-5 w-5" /> },
  { id: 'templates', label: 'Plantillas', icon: <LayoutTemplate className="h-5 w-5" /> },
  { id: 'settings', label: 'ConfiguraciÃ³n', icon: <Settings className="h-5 w-5" /> },
]

export function Sidebar() {
  const { currentView, setView, setSidebarOpen, user } = useAppStore()
  const [stats, setStats] = useState({ videos: 0, scheduled: 0, published: 0 })

  useEffect(() => {
    async function fetchStats() {
      if (!user?.id) return
      try {
        const [videosRes, postsRes] = await Promise.all([
          fetch('/api/videos'),
          fetch('/api/schedule')
        ])
        const videosData = await videosRes.json()
        const postsData = await postsRes.json()
        const vids = videosData.videos || []
        const posts = postsData.posts || []
        setStats({
          videos: vids.length,
          scheduled: posts.filter((p: any) => p.status === 'scheduled').length,
          published: posts.filter((p: any) => p.status === 'published').length + vids.filter((v: any) => v.status === 'completed').length,
        })
      } catch (error) {
        console.error('Error fetching sidebar stats:', error)
      }
    }
    fetchStats()
  }, [user?.id])

  const handleNavClick = (viewId: SidebarSection) => {
    setView(viewId)
    setSidebarOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo section */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-lg gradient-text">VideoFlow</h2>
          <p className="text-xs text-muted-foreground">Studio</p>
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = currentView === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  'w-full justify-start gap-3 h-11 px-3 font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-purple-500/15 to-fuchsia-500/10 text-purple-300 hover:from-purple-500/20 hover:to-fuchsia-500/15 hover:text-purple-200'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <span className={cn(
                  'transition-colors',
                  isActive ? 'text-purple-400' : ''
                )}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400" />
                )}
              </Button>
            )
          })}
        </nav>

        <Separator className="my-4 bg-border/50" />

        {/* Quick stats */}
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Resumen RÃ¡pido
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Videos</span>
              <span className="font-semibold text-purple-300">{stats.videos}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Programados</span>
              <span className="font-semibold text-fuchsia-300">{stats.scheduled}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Publicados</span>
              <span className="font-semibold text-green-400">{stats.published}</span>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border/50">
        <div className="glass rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <span className="text-xs font-semibold">Plan Pro</span>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            Desbloquea IA avanzada y exportaciÃ³n 4K
          </p>
          <Button size="sm" className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white text-xs h-8">
            Actualizar
          </Button>
        </div>
      </div>
    </div>
  )
}
