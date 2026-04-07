'use client'

import { useAppStore } from '@/lib/store'
import { StatsCards } from './stats-cards'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { motion } from 'framer-motion'
import { Plus, Clock, CheckCircle, AlertCircle, ArrowRight, Play } from 'lucide-react'

const recentVideos = [
  { id: '1', title: 'Tutorial React Hooks Avanzado', status: 'completed', platform: 'youtube', views: '3.2K', duration: '12:30' },
  { id: '2', title: '5 Tips para TikTok en 2025', status: 'processing', platform: 'tiktok', views: '-', duration: '00:45' },
  { id: '3', title: 'Review iPhone 16 Pro', status: 'scheduled', platform: 'instagram', views: '-', duration: '08:15' },
  { id: '4', title: 'Cómo Empezar en YouTube', status: 'completed', platform: 'youtube', views: '15.8K', duration: '15:00' },
  { id: '5', title: 'Unboxing RTX 5090', status: 'draft', platform: 'tiktok', views: '-', duration: '01:20' },
]

const upcomingPosts = [
  { id: '1', title: 'Tutorial React Hooks', platform: 'YouTube', date: 'Hoy, 18:00' },
  { id: '2', title: '5 Tips para TikTok', platform: 'TikTok', date: 'Mañana, 12:00' },
  { id: '3', title: 'Review iPhone 16', platform: 'Instagram', date: 'Mié, 09:00' },
  { id: '4', title: 'Starter Pack Gamer', platform: 'Facebook', date: 'Jue, 20:00' },
]

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Completado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: 'Procesando', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="h-3 w-3" /> },
  scheduled: { label: 'Programado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <Clock className="h-3 w-3" /> },
  draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground border-border', icon: <AlertCircle className="h-3 w-3" /> },
  failed: { label: 'Fallido', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <AlertCircle className="h-3 w-3" /> },
}

const platformColors: Record<string, string> = {
  youtube: 'text-red-400',
  tiktok: 'text-pink-400',
  instagram: 'text-orange-400',
  facebook: 'text-blue-400',
}

export function Dashboard() {
  const { setView } = useAppStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bienvenido de vuelta. Aquí tienes tu resumen.</p>
        </div>
        <Button
          onClick={() => setView('video-creator')}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 w-fit"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Video
        </Button>
      </motion.div>

      {/* Stats */}
      <StatsCards />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Videos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Videos Recientes</CardTitle>
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300" onClick={() => setView('video-creator')}>
                Ver Todos <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <div className="divide-y divide-border/30">
                  {recentVideos.map((video, i) => {
                    const status = statusConfig[video.status]
                    return (
                      <motion.div
                        key={video.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                      >
                        {/* Thumbnail placeholder */}
                        <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                          <Play className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{video.title}</p>
                          <p className="text-xs text-muted-foreground">{video.duration}</p>
                        </div>

                        {/* Status */}
                        <Badge variant="outline" className={`text-xs ${status.color}`}>
                          {status.icon}
                          <span className="ml-1">{status.label}</span>
                        </Badge>

                        {/* Views */}
                        <span className="text-sm text-muted-foreground w-16 text-right hidden sm:block">
                          {video.views}
                        </span>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Posts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Próximos Posts</CardTitle>
              <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300" onClick={() => setView('scheduler')}>
                Ver Calendario <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-96">
                <div className="divide-y divide-border/30">
                  {upcomingPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">{post.platform}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{post.date}</span>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
