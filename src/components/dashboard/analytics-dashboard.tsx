'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent, type ChartConfig,
} from '@/components/ui/chart'
import {
  Bar, BarChart, Area, AreaChart,
  Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import {
  Eye, TrendingUp, Users, Zap, ArrowUpRight, ArrowDownRight, Activity, Target,
} from 'lucide-react'

const PIE_COLORS = ['#a855f7', '#d946ef', '#06b6d4', '#22c55e', '#f59e0b']

export function AnalyticsDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="glass">
        <CardContent className="p-8 text-center">
          <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No se pudieron cargar los analytics.</p>
        </CardContent>
      </Card>
    )
  }

  const { kpis, weeklyData, hourlyData, platformPerformance, contentDistribution, topContent } = data

  const kpiCards = [
    { label: 'Visualizaciones', value: kpis.totalViews.toLocaleString(), icon: Eye, change: '+12.5%', up: true, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Engagement', value: kpis.totalEngagement.toLocaleString(), icon: Zap, change: '+8.2%', up: true, color: 'text-fuchsia-400', bg: 'bg-fuchsia-500/10' },
    { label: 'Crecimiento', value: `${kpis.avgGrowth}%`, icon: TrendingUp, change: kpis.avgGrowth > 0 ? '+' + kpis.avgGrowth + '%' : kpis.avgGrowth + '%', up: kpis.avgGrowth > 0, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Publicados', value: `${kpis.publishedPosts}/${kpis.totalPosts}`, icon: Target, change: `${kpis.scheduledPosts} programados`, up: true, color: 'text-green-400', bg: 'bg-green-500/10' },
  ]

  const weeklyConfig: ChartConfig = {
    views: { label: 'Visualizaciones', color: 'hsl(var(--chart-1))' },
    engagement: { label: 'Engagement', color: 'hsl(var(--chart-2))' },
  }

  const hourlyConfig: ChartConfig = {
    engagement: { label: 'Engagement', color: 'hsl(var(--chart-3))' },
  }

  const platformConfig: ChartConfig = {
    reach: { label: 'Alcance', color: 'hsl(var(--chart-1))' },
    engagement: { label: 'Engagement', color: 'hsl(var(--chart-2))' },
    followers: { label: 'Seguidores', color: 'hsl(var(--chart-4))' },
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <Card className="glass border-border/30 hover:border-purple-500/30 transition-colors">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
                    <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {kpi.change}
                  </div>
                </div>
                <p className="text-2xl font-bold">{kpi.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views & Engagement Over Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Visualizaciones y Engagement</CardTitle>
              <CardDescription>Tendencia de las ultimas 12 semanas</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={weeklyConfig} className="h-64 w-full">
                <AreaChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="fillEng" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="week" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--chart-1))" fill="url(#fillViews)" strokeWidth={2} />
                  <Area type="monotone" dataKey="engagement" stroke="hsl(var(--chart-2))" fill="url(#fillEng)" strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Posting Times */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Mejores Horas para Publicar</CardTitle>
              <CardDescription>Engagement promedio por hora del dia</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={hourlyConfig} className="h-64 w-full">
                <BarChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
                  <XAxis dataKey="hour" className="text-xs" tickLine={false} axisLine={false} interval={2} />
                  <YAxis className="text-xs" tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="engagement" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rendimiento por Plataforma</CardTitle>
              <CardDescription>Alcance, engagement y seguidores</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={platformConfig} className="h-64 w-full">
                <BarChart data={platformPerformance} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" horizontal={false} />
                  <XAxis type="number" className="text-xs" tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="platform" className="text-xs" tickLine={false} axisLine={false} width={80} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="reach" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} barSize={8} />
                  <Bar dataKey="engagement" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} barSize={8} />
                  <Bar dataKey="followers" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} barSize={8} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Distribucion de Contenido</CardTitle>
              <CardDescription>Estado de videos y publicaciones</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}} className="h-64 w-full mx-auto" style={{ maxWidth: 280 }}>
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={contentDistribution.length > 0 ? contentDistribution : [{ type: 'Sin datos', value: 1, fill: 'hsl(var(--muted))' }]}
                    dataKey="value"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={50}
                    strokeWidth={2}
                    stroke="hsl(var(--background))"
                  >
                    {contentDistribution.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {contentDistribution.length > 0 ? (
                  contentDistribution.map((item: any, idx: number) => (
                    <div key={item.type} className="flex items-center gap-1.5 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-muted-foreground">{item.type}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground">Crea contenido para ver estadisticas</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Growth Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="glass border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Crecimiento por Plataforma</CardTitle>
            <CardDescription>Metricas detalladas de cada red social</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Plataforma</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Posts</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Alcance</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Engagement</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Seguidores</th>
                    <th className="text-right py-3 px-2 font-medium text-muted-foreground">Crecimiento</th>
                  </tr>
                </thead>
                <tbody>
                  {platformPerformance.map((p: any) => (
                    <tr key={p.platform} className="border-b border-border/20 hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-2 font-medium">{p.platform}</td>
                      <td className="text-right py-3 px-2">{p.posts}</td>
                      <td className="text-right py-3 px-2">{p.reach.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">{p.engagement.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">{p.followers.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">
                        <Badge variant={p.growth >= 0 ? 'default' : 'destructive'} className={p.growth >= 0 ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'}>
                          {p.growth > 0 ? '+' : ''}{p.growth}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Content */}
      {topContent && topContent.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Top Contenido</CardTitle>
              <CardDescription>Tus videos con mejor rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topContent.map((item: any, idx: number) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                    <span className="text-lg font-bold text-muted-foreground w-6">#{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString('es', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-center">
                        <p className="font-medium">{item.views.toLocaleString()}</p>
                        <p className="text-muted-foreground">Vistas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{item.likes.toLocaleString()}</p>
                        <p className="text-muted-foreground">Likes</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium">{item.comments}</p>
                        <p className="text-muted-foreground">Comments</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
