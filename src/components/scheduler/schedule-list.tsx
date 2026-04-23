'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type ScheduledPost } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Clock, Trash2, Play, Youtube, Instagram, Facebook, Filter, ListX } from 'lucide-react'
import { toast } from 'sonner'

const platformIcons: Record<string, React.ReactNode> = {
  youtube: <Youtube className="h-4 w-4 text-red-400" />,
  tiktok: <Play className="h-4 w-4 text-pink-400" />,
  instagram: <Instagram className="h-4 w-4 text-orange-400" />,
  facebook: <Facebook className="h-4 w-4 text-blue-400" />,
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  published: { label: 'Publicado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  failed: { label: 'Fallido', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

export function ScheduleList() {
  const [posts, setPosts] = useState<ScheduledPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const { user } = useAppStore()

  const fetchPosts = useCallback(async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const res = await fetch('/api/schedule')
      const data = await res.json()
      setPosts(data.posts || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const filtered = posts.filter((p) => {
    if (filter !== 'all' && p.platform !== filter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const groupedByDate = filtered.reduce<Record<string, ScheduledPost[]>>((acc, post) => {
    const date = format(new Date(post.scheduledAt), 'yyyy-MM-dd')
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {})

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/schedule?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Post eliminado')
        fetchPosts()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  return (
    <Card className="glass border-border/30">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg">Todas las Publicaciones</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50">
                <Filter className="mr-1 h-3 w-3" />
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background/50">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Programado</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[500px]">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-14 rounded-lg bg-muted/20" />)}
            </div>
          ) : Object.entries(groupedByDate).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ListX className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay posts que coincidan con los filtros</p>
            </div>
          ) : (
            <div>
              {Object.entries(groupedByDate).map(([date, datePosts]) => (
                <div key={date}>
                  <div className="px-4 py-2 bg-muted/20">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {format(new Date(date), "EEEE, d 'de' MMMM yyyy", { locale: es })}
                    </span>
                  </div>
                  <div className="divide-y divide-border/20">
                    {datePosts.map((post, i) => {
                      const status = statusConfig[post.status]
                      return (
                        <motion.div
                          key={post.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                        >
                          {platformIcons[post.platform]}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.caption || 'Sin descripción'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(post.scheduledAt), 'HH:mm')}
                              </span>
                              {post.hashtags && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {post.hashtags}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${status.color}`}>
                            {status.label}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
