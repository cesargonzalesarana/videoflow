'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAppStore, type TrendTopic } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import { Flame, TrendingUp, Sparkles, Copy, RefreshCw, ExternalLink, Hash } from 'lucide-react'
import { toast } from 'sonner'

const categoryColors: Record<string, string> = {
  'Tecnología': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Entretenimiento': 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
  'Educación': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Lifestyle': 'bg-green-500/10 text-green-400 border-green-500/20',
  'Negocios': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Salud': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Gaming': 'bg-red-500/10 text-red-400 border-red-500/20',
}

export function TrendsFeed() {
  const [trends, setTrends] = useState<TrendTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const { setTrends: storeTrends } = useAppStore()

  const fetchTrends = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/trends')
      const data = await res.json()
      setTrends(data.trends)
      storeTrends(data.trends)
    } catch {
      toast.error('Error al cargar tendencias')
    } finally {
      setIsLoading(false)
    }
  }, [storeTrends])

  useEffect(() => {
    fetchTrends()
  }, [fetchTrends])

  const categories = ['all', ...new Set(trends.map((t) => t.category))]
  const filtered = categoryFilter === 'all' ? trends : trends.filter((t) => t.category === categoryFilter)

  const copyHashtags = (hashtags: string[]) => {
    navigator.clipboard.writeText(hashtags.join(' '))
    toast.success('Hashtags copiados!')
  }

  return (
    <Card className="glass border-border/30">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            Tendencias Actuales
          </CardTitle>
          <Button variant="outline" size="sm" onClick={fetchTrends} disabled={isLoading} className="border-purple-500/30 text-purple-400">
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={categoryFilter === cat ? 'default' : 'outline'}
              size="sm"
              className={
                categoryFilter === cat
                  ? 'bg-purple-600 text-white h-7 text-xs'
                  : 'h-7 text-xs border-border/50'
              }
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? 'Todas' : cat}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[600px]">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg">
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map((trend, i) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-muted/20 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-orange-400">#{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold">{trend.title}</h4>
                      <Badge variant="outline" className={`text-[10px] ${categoryColors[trend.category] || 'bg-muted text-muted-foreground'}`}>
                        {trend.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{trend.description}</p>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">+{trend.growth}%</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {(trend.engagement / 1000).toFixed(1)}K engagement
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {trend.hashtags.map((tag) => (
                        <span key={tag} className="text-xs text-purple-400 font-medium">{tag}</span>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyHashtags(trend.hashtags)}
                      >
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
