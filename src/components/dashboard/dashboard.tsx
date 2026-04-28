'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { StatsCards } from './stats-cards'
import { AnalyticsDashboard } from './analytics-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Plus, Clock, CheckCircle, AlertCircle, ArrowRight, Play, Video, CalendarDays, BarChart3 } from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: 'Completado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
  processing: { label: 'Procesando', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', icon: <Clock className="h-3 w-3" /> },
  scheduled: { label: 'Programado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', icon: <Clock className="h-3 w-3" /> },
  draft: { label: 'Borrador', color: 'bg-muted text-muted-foreground border-border', icon: <AlertCircle className="h-3 w-3" /> },
  failed: { label: 'Fallido', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: <AlertCircle className="h-3 w-3" /> },
  published: { label: 'Publicado', color: 'bg-green-500/10 text-green-400 border-green-500/20', icon: <CheckCircle className="h-3 w-3" /> },
}

export function Dashboard() {
  const { user, setView } = useAppStore()
  const [videos, setVideos] = useState<any[]>([])
  const [scheduledPosts, setScheduledPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!user?.id) return
      try {
        const [videosRes, postsRes] = await Promise.all([
          fetch(`/api/videos?userId=${user.id}`),
          fetch(`/api/schedule?userId=${user.id}`)
        ])
        const videosData = await videosRes.json()
        const postsData = await postsRes.json()
        setVideos(videosData.videos || [])
        setScheduledPosts(postsData.posts || [])
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const completedVideos = videos.filter(v => v.status === 'completed').length
  const activeScheduled = scheduledPosts.filter(p => p.status === 'scheduled').length
  const recentVideos = videos.slice(0, 8)
  const upcomingPosts = scheduledPosts
    .filter(p => new Date(p.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5)

  const formatDuration = (seconds: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

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
          <p className="text-muted-foreground">Bienvenido de vuelta, {user?.name?.split(' ')[0]}</p>
        </div>
        <Button
          onClick={() => setView('video-creator')}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 w-fit"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Video
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-muted/50 h-10 p-1 w-fit">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white">
            Resumen
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white">
            <BarChart3 className="h-4 w-4 mr-1" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-32 rounded-xl bg-muted/30" />
              ))}
            </div>
          ) : (
            <StatsCards
              totalVideos={videos.length}
              scheduledPosts={activeScheduled}
              completedVideos={completedVideos}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card className="glass border-border/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Video className="h-5 w-5 text-purple-400" />
                    Videos Recientes
                  </CardTitle>
                  {videos.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300" onClick={() => setView('video-creator')}>
                      Ver Todos <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-14 rounded-lg bg-muted/20" />
                      ))}
                    </div>
                  ) : recentVideos.length === 0 ? (
                    <div className="text-center py-16 px-6">
                      <Video className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium mb-1">No hay videos aun</p>
                      <p className="text-sm text-muted-foreground mb-4">Crea tu primer video para comenzar</p>
                      <Button
                        onClick={() => setView('video-creator')}
                        variant="outline"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Video
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-96">
                      <div className="divide-y divide-border/30">
                        {recentVideos.map((video, i) => {
                          const status = statusConfig[video.status] || statusConfig.draft
                          return (
                            <motion.div
                              key={video.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.1 + i * 0.05 }}
                              className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer group"
                            >
                              <div className="w-16 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center flex-shrink-0">
                                <Play className="h-4 w-4 text-purple-400 group-hover:text-purple-300" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{video.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {video.duration ? formatDuration(video.duration) : '--'}
                                  {video.resolution && ` | ${video.resolution}`}
                                </p>
                              </div>
                              <Badge variant="outline" className={`text-xs ${status.color}`}>
                                {status.icon}
                                <span className="ml-1">{status.label}</span>
                              </Badge>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="glass border-border/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-fuchsia-400" />
                    Proximos Posts
                  </CardTitle>
                  {scheduledPosts.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300" onClick={() => setView('scheduler')}>
                      Ver Calendario <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  {loading ? (
                    <div className="p-6 space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-14 rounded-lg bg-muted/20" />
                      ))}
                    </div>
                  ) : upcomingPosts.length === 0 ? (
                    <div className="text-center py-12 px-6">
                      <CalendarDays className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground mb-3">Sin publicaciones programadas</p>
                      <Button
                        onClick={() => setView('scheduler')}
                        variant="outline"
                        size="sm"
                        className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Programar Post
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="max-h-96">
                      <div className="divide-y divide-border/30">
                        {upcomingPosts.map((post, i) => {
                          const status = statusConfig[post.status] || statusConfig.scheduled
                          const platformColors: Record<string, string> = {
                            youtube: 'text-red-400', tiktok: 'text-pink-400',
                            instagram: 'text-orange-400', facebook: 'text-blue-400'
                          }
                          return (
                            <motion.div
                              key={post.id}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.2 + i * 0.05 }}
                              className="flex items-center gap-3 px-6 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                            >
                              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{post.caption || 'Sin descripcion'}</p>
                                <p className={`text-xs ${platformColors[post.platform] || 'text-muted-foreground'}`}>
                                  {post.platform}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="text-xs text-muted-foreground block">
                                  {new Date(post.scheduledAt).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(post.scheduledAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </motion.div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <AnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  )
}
