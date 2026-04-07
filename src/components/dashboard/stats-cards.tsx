'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Calendar, TrendingUp, Eye, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { motion } from 'framer-motion'

const stats = [
  { label: 'Videos Creados', value: '12', change: '+3 esta semana', icon: Video, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { label: 'Programados', value: '8', change: 'Próximos 7 días', icon: Calendar, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
  { label: 'Total Vistas', value: '24.5K', change: '+18% vs mes anterior', icon: Eye, color: 'text-green-400', bg: 'bg-green-500/10' },
  { label: 'Tasa Engage', value: '8.2%', change: '+2.1% mejora', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
]

export function StatsCards() {
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
