'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Video, Calendar, Eye, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatsCardsProps {
  totalVideos?: number
  scheduledPosts?: number
  completedVideos?: number
}

export function StatsCards({ totalVideos = 0, scheduledPosts = 0, completedVideos = 0 }: StatsCardsProps) {
  const stats = [
    { 
      label: 'Videos Creados', 
      value: totalVideos.toString(), 
      change: totalVideos > 0 ? `${totalVideos} video${totalVideos !== 1 ? 's' : ''} en total` : 'Crea tu primer video',
      icon: Video, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/10' 
    },
    { 
      label: 'Programados', 
      value: scheduledPosts.toString(), 
      change: scheduledPosts > 0 ? `${scheduledPosts} publicación${scheduledPosts !== 1 ? 'es' : ''} pendiente${scheduledPosts !== 1 ? 's' : ''}` : 'Sin publicaciones programadas',
      icon: Calendar, 
      color: 'text-fuchsia-400', 
      bg: 'bg-fuchsia-500/10' 
    },
    { 
      label: 'Completados', 
      value: completedVideos.toString(), 
      change: completedVideos > 0 ? `${completedVideos} video${completedVideos !== 1 ? 's' : ''} exportado${completedVideos !== 1 ? 's' : ''}` : 'Aún sin exportar',
      icon: Eye, 
      color: 'text-green-400', 
      bg: 'bg-green-500/10' 
    },
    { 
      label: 'Productividad', 
      value: totalVideos > 0 ? `${Math.round((completedVideos / totalVideos) * 100)}%` : '0%',
      change: totalVideos > 0 ? `${completedVideos} de ${totalVideos} completados` : 'Empieza creando',
      icon: TrendingUp, 
      color: 'text-amber-400', 
      bg: 'bg-amber-500/10' 
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.1 }}
        >
          <Card className="glass border-border/30 hover:border-purple-500/20 transition-all duration-300">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold mb-1">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
