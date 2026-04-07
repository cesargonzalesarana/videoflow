'use client'

import { useState } from 'react'
import { useAppStore, type ScheduledPost } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { format, isSameDay, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  CalendarIcon, Clock, Plus, Trash2, Edit, Play,
  Youtube, Instagram, Facebook, ChevronLeft, ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'

const platformIcons: Record<string, React.ReactNode> = {
  youtube: <Youtube className="h-4 w-4 text-red-400" />,
  tiktok: <Play className="h-4 w-4 text-pink-400" />,
  instagram: <Instagram className="h-4 w-4 text-orange-400" />,
  facebook: <Facebook className="h-4 w-4 text-blue-400" />,
}

const platformLabels: Record<string, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
}

const statusConfig: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'Programado', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  published: { label: 'Publicado', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  failed: { label: 'Fallido', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
}

// Mock scheduled posts
const mockPosts: ScheduledPost[] = [
  { id: '1', videoId: 'v1', userId: 'u1', platform: 'youtube', scheduledAt: new Date(Date.now() + 86400000).toISOString(), status: 'scheduled', caption: 'Tutorial de React avanzado', hashtags: '#react #programming', createdAt: new Date().toISOString() },
  { id: '2', videoId: 'v2', userId: 'u1', platform: 'tiktok', scheduledAt: new Date(Date.now() + 172800000).toISOString(), status: 'scheduled', caption: '5 tips para programar mejor', hashtags: '#coding #tips', createdAt: new Date().toISOString() },
  { id: '3', videoId: 'v3', userId: 'u1', platform: 'instagram', scheduledAt: new Date(Date.now() + 345600000).toISOString(), status: 'scheduled', caption: 'Review del nuevo framework', hashtags: '#tech #review', createdAt: new Date().toISOString() },
  { id: '4', videoId: 'v4', userId: 'u1', platform: 'facebook', scheduledAt: new Date(Date.now() - 86400000).toISOString(), status: 'published', caption: 'Unboxing RTX 5090', hashtags: '#hardware #gaming', createdAt: new Date().toISOString(), publishedAt: new Date().toISOString() },
  { id: '5', videoId: 'v5', userId: 'u1', platform: 'youtube', scheduledAt: new Date(Date.now() - 172800000).toISOString(), status: 'failed', caption: 'Setup tour 2025', hashtags: '#setup #desk', createdAt: new Date().toISOString() },
]

export function CalendarView() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [posts] = useState<ScheduledPost[]>(mockPosts)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPost, setNewPost] = useState({ platform: '', caption: '', hashtags: '', scheduledTime: '12:00' })
  const { user } = useAppStore()

  const postsForDate = (date: Date) =>
    posts.filter((p) => isSameDay(new Date(p.scheduledAt), date))

  const upcomingPosts = posts
    .filter((p) => new Date(p.scheduledAt) >= new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const handleCreatePost = async () => {
    if (!selectedDate || !newPost.platform) {
      toast.error('Selecciona fecha y plataforma')
      return
    }

    const scheduledAt = new Date(selectedDate)
    const [hours, minutes] = newPost.scheduledTime.split(':')
    scheduledAt.setHours(parseInt(hours), parseInt(minutes))

    const { addScheduledPost } = useAppStore.getState()
    addScheduledPost({
      id: Math.random().toString(36).substr(2, 9),
      videoId: 'v_new',
      userId: user?.id || 'u1',
      platform: newPost.platform as ScheduledPost['platform'],
      scheduledAt: scheduledAt.toISOString(),
      status: 'scheduled',
      caption: newPost.caption,
      hashtags: newPost.hashtags,
      createdAt: new Date().toISOString(),
    })

    toast.success('Post programado correctamente')
    setIsDialogOpen(false)
    setNewPost({ platform: '', caption: '', hashtags: '', scheduledTime: '12:00' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div>
          <h1 className="text-2xl font-bold">Programar</h1>
          <p className="text-muted-foreground text-sm">Gestiona la publicación de tus videos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 w-fit">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Post
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>Programar Nueva Publicación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={newPost.platform} onValueChange={(v) => setNewPost({ ...newPost, platform: v })}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue placeholder="Seleccionar plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="youtube">YouTube</SelectItem>
                    <SelectItem value="tiktok">TikTok</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  placeholder="Describe tu publicación..."
                  value={newPost.caption}
                  onChange={(e) => setNewPost({ ...newPost, caption: e.target.value })}
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <Input
                  placeholder="#tech #viral #content"
                  value={newPost.hashtags}
                  onChange={(e) => setNewPost({ ...newPost, hashtags: e.target.value })}
                  className="bg-background/50 border-border/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="bg-background/50 border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={newPost.scheduledTime}
                    onChange={(e) => setNewPost({ ...newPost, scheduledTime: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>
              </div>
              <Button onClick={handleCreatePost} className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white">
                Programar Publicación
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-purple-400" />
                  {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addDays(currentMonth, -30))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setCurrentMonth(new Date())}>
                    Hoy
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addDays(currentMonth, 30))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) })
                  .map((day) => {
                    const dayPosts = postsForDate(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                    const isCurrent = isToday(day)

                    return (
                      <div
                        key={day.toISOString()}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          relative p-2 rounded-lg text-center cursor-pointer transition-all min-h-[60px]
                          ${isSelected ? 'bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 border border-purple-500/30' : 'hover:bg-muted/30 border border-transparent'}
                        `}
                      >
                        <span className={`text-xs font-medium ${isCurrent ? 'text-purple-400' : ''}`}>
                          {format(day, 'd')}
                        </span>
                        {dayPosts.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
                            {dayPosts.slice(0, 3).map((post) => (
                              <div
                                key={post.id}
                                className={`w-1.5 h-1.5 rounded-full ${
                                  post.platform === 'youtube' ? 'bg-red-400' :
                                  post.platform === 'tiktok' ? 'bg-pink-400' :
                                  post.platform === 'instagram' ? 'bg-orange-400' : 'bg-blue-400'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right sidebar - Posts list */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* Selected date posts */}
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">
                {selectedDate
                  ? format(selectedDate, "d 'de' MMMM", { locale: es })
                  : 'Selecciona una fecha'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {selectedDate ? (
                <ScrollArea className="max-h-48">
                  {postsForDate(selectedDate).length > 0 ? (
                    <div className="divide-y divide-border/30">
                      {postsForDate(selectedDate).map((post) => (
                        <div key={post.id} className="px-4 py-3 flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {platformIcons[post.platform]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{post.caption || 'Sin descripción'}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(post.scheduledAt), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No hay posts para este día
                    </div>
                  )}
                </ScrollArea>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  Haz clic en un día del calendario
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming posts */}
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Próximos Programados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="max-h-64">
                <div className="divide-y divide-border/30">
                  {upcomingPosts.map((post, i) => {
                    const status = statusConfig[post.status]
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="px-4 py-3 hover:bg-muted/20 transition-colors group"
                      >
                        <div className="flex items-center gap-3 mb-1">
                          {platformIcons[post.platform]}
                          <span className="text-xs text-muted-foreground">{platformLabels[post.platform]}</span>
                          <Badge variant="outline" className={`text-[10px] ml-auto ${status.color}`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium truncate">{post.caption || 'Sin descripción'}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(post.scheduledAt), "d MMM, HH:mm", { locale: es })}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
