'use client'

import { useState, useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Bell, Check, CheckCheck, Video, Calendar, AlertTriangle, TrendingUp, Info, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  icon?: string
}

const iconMap: Record<string, React.ReactNode> = {
  video: <Video className="h-4 w-4" />,
  calendar: <Calendar className="h-4 w-4" />,
  trend: <TrendingUp className="h-4 w-4" />,
  alert: <AlertTriangle className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
}

const typeStyles: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400',
  success: 'bg-green-500/10 text-green-400',
  warning: 'bg-amber-500/10 text-amber-400',
  error: 'bg-red-500/10 text-red-400',
}

export function NotificationPanel() {
  const { user } = useAppStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const hasFetched = useRef(false)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (user?.id && !hasFetched.current) {
      hasFetched.current = true
      fetchNotifications()
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [user?.id])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch {
      // Use sample notifications on error
      setNotifications(generateSampleNotifications())
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'read' }),
      })
    } catch { /* ignore */ }
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'readAll' }),
      })
    } catch { /* ignore */ }
  }

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      })
    } catch { /* ignore */ }
  }

  function generateSampleNotifications(): Notification[] {
    const now = new Date()
    return [
      {
        id: '1',
        title: 'Video procesado',
        message: 'Tu video "Tutorial React" se proceso correctamente y esta listo para publicar.',
        type: 'success',
        read: false,
        createdAt: new Date(now.getTime() - 5 * 60000).toISOString(),
        icon: 'video',
      },
      {
        id: '2',
        title: 'Publicacion programada',
        message: 'Se programo una publicacion en Instagram para manana a las 10:00 AM.',
        type: 'info',
        read: false,
        createdAt: new Date(now.getTime() - 30 * 60000).toISOString(),
        icon: 'calendar',
      },
      {
        id: '3',
        title: 'Tendencia detectada',
        message: '"Shorts de cocina" esta trending en YouTube con +500K interacciones.',
        type: 'info',
        read: false,
        createdAt: new Date(now.getTime() - 2 * 3600000).toISOString(),
        icon: 'trend',
      },
      {
        id: '4',
        title: 'Publicacion exitosa',
        message: 'Tu video fue publicado correctamente en TikTok y ya tiene 150 visualizaciones.',
        type: 'success',
        read: true,
        createdAt: new Date(now.getTime() - 5 * 3600000).toISOString(),
        icon: 'video',
      },
      {
        id: '5',
        title: 'Almacenamiento casi lleno',
        message: 'Has usado el 85% de tu almacenamiento gratuito. Considera actualizar tu plan.',
        type: 'warning',
        read: true,
        createdAt: new Date(now.getTime() - 24 * 3600000).toISOString(),
        icon: 'alert',
      },
    ]
  }

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Ahora'
    if (mins < 60) return `hace ${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `hace ${days}d`
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 glass-strong border-border/50">
        <div className="flex items-center justify-between p-4 border-b border-border/50">
          <h3 className="font-semibold">Notificaciones</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-purple-400 hover:text-purple-300 h-auto p-0"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3 w-3 mr-1" />
              Marcar todo leido
            </Button>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Cargando...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No hay notificaciones</p>
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y divide-border/30">
              <AnimatePresence>
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 p-3 hover:bg-muted/30 transition-colors cursor-pointer group ${!notif.read ? 'bg-purple-500/5' : ''}`}
                    onClick={() => markAsRead(notif.id)}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeStyles[notif.type]}`}>
                      {iconMap[notif.icon || 'info'] || iconMap.info}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm ${!notif.read ? 'font-medium' : 'font-normal'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{formatTimeAgo(notif.createdAt)}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteNotification(notif.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  )
}
