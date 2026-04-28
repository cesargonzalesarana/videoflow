'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Clock, TrendingUp, Film, Music, Sparkles,
  ShoppingBag, GraduationCap, Heart, Briefcase, Play,
  Star, Download, Eye,
} from 'lucide-react'
import { toast } from 'sonner'

interface Template {
  id: string
  name: string
  description: string
  category: string
  duration: string
  format: string
  tags: string[]
  popular: boolean
  icon: React.ReactNode
  gradient: string
}

const templates: Template[] = [
  {
    id: 'intro-yt',
    name: 'Intro YouTube',
    description: 'Intro profesional para canales de YouTube con logo animado y transicion.',
    category: 'YouTube',
    duration: '0:05',
    format: '1920x1080',
    tags: ['intro', 'youtube', 'canal'],
    popular: true,
    icon: <Play className="h-8 w-8" />,
    gradient: 'from-red-500 to-red-600',
  },
  {
    id: 'shorts-viral',
    name: 'Shorts Viral',
    description: 'Template para TikTok/Reels con texto dinamico, transiciones rapidas y musica trending.',
    category: 'TikTok',
    duration: '0:15',
    format: '1080x1920',
    tags: ['shorts', 'viral', 'tiktok'],
    popular: true,
    icon: <TrendingUp className="h-8 w-8" />,
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'story-promo',
    name: 'Story Promocional',
    description: 'Story de Instagram para promocionar productos o servicios con CTA animado.',
    category: 'Instagram',
    duration: '0:10',
    format: '1080x1920',
    tags: ['story', 'promo', 'instagram'],
    popular: true,
    icon: <ShoppingBag className="h-8 w-8" />,
    gradient: 'from-orange-400 to-pink-500',
  },
  {
    id: 'tutorial',
    name: 'Tutorial Paso a Paso',
    description: 'Template educativo con pasos numerados, overlays de texto y pistas para voiceover.',
    category: 'Educacion',
    duration: '1:00',
    format: '1920x1080',
    tags: ['tutorial', 'educacion', 'pasos'],
    popular: false,
    icon: <GraduationCap className="h-8 w-8" />,
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'reel-music',
    name: 'Reel Musical',
    description: 'Reel sincronizado con musica, efectos de transicion y texto con beats.',
    category: 'Instagram',
    duration: '0:30',
    format: '1080x1920',
    tags: ['reel', 'musica', 'trending'],
    popular: true,
    icon: <Music className="h-8 w-8" />,
    gradient: 'from-purple-500 to-fuchsia-500',
  },
  {
    id: 'product-review',
    name: 'Review de Producto',
    description: 'Template para reviews con secciones de pros/contras, rating visual y CTA.',
    category: 'Review',
    duration: '0:45',
    format: '1920x1080',
    tags: ['review', 'producto', 'opinion'],
    popular: false,
    icon: <Star className="h-8 w-8" />,
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    id: 'motivational',
    name: 'Video Motivacional',
    description: 'Template con citas inspiradoras, fondo cinemático y tipografia elegante.',
    category: 'Motivacion',
    duration: '0:20',
    format: '1080x1920',
    tags: ['motivacion', 'citas', 'inspiracion'],
    popular: false,
    icon: <Sparkles className="h-8 w-8" />,
    gradient: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'business-pitch',
    name: 'Pitch de Negocio',
    description: 'Template corporativo para presentar propuestas con datos, graficos y branding.',
    category: 'Negocio',
    duration: '1:30',
    format: '1920x1080',
    tags: ['negocio', 'pitch', 'corporativo'],
    popular: false,
    icon: <Briefcase className="h-8 w-8" />,
    gradient: 'from-slate-500 to-slate-700',
  },
  {
    id: 'react-video',
    name: 'Video de Reaccion',
    description: 'Layout tipo reaccion con video original, tu reaccion en esquina y comentarios.',
    category: 'YouTube',
    duration: '0:30',
    format: '1920x1080',
    tags: ['reaccion', 'youtube', 'gameplay'],
    popular: true,
    icon: <Film className="h-8 w-8" />,
    gradient: 'from-red-500 to-orange-500',
  },
  {
    id: 'love-story',
    name: 'Slideshow Romantico',
    description: 'Transiciones suaves con fotos, musica de fondo y texto romatico animado.',
    category: 'Personal',
    duration: '0:45',
    format: '1080x1920',
    tags: ['amor', 'fotos', 'slideshow'],
    popular: false,
    icon: <Heart className="h-8 w-8" />,
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    id: 'podcast-clip',
    name: 'Clip de Podcast',
    description: 'Extrae clips de podcast con subtitulos automaticos, waveform visual y branding.',
    category: 'Podcast',
    duration: '0:60',
    format: '1920x1080',
    tags: ['podcast', 'clip', 'subtitulos'],
    popular: false,
    icon: <Eye className="h-8 w-8" />,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    id: 'countdown',
    name: 'Cuenta Regresiva',
    description: 'Countdown animado para lanzamientos, eventos o ofertas especiales con efecto urgente.',
    category: 'Marketing',
    duration: '0:10',
    format: '1080x1920',
    tags: ['countdown', 'lanzamiento', 'oferta'],
    popular: false,
    icon: <Clock className="h-8 w-8" />,
    gradient: 'from-emerald-400 to-teal-500',
  },
]

const categories = ['Todos', ...Array.from(new Set(templates.map(t => t.category)))]

export function TemplateGallery() {
  const { setView } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Todos')

  const filtered = templates.filter((t) => {
    const matchSearch = search === '' ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some(tag => tag.includes(search.toLowerCase()))
    const matchCategory = selectedCategory === 'Todos' || t.category === selectedCategory
    return matchSearch && matchCategory
  })

  const handleUseTemplate = (template: Template) => {
    toast.success(`Template "${template.name}" seleccionado`)
    setView('video-creator')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold">Templates</h1>
        <p className="text-muted-foreground text-sm">Comienza con un template profesional y personaliza a tu gusto</p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-background/50 border-border/50"
          />
        </div>
      </motion.div>

      {/* Categories */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white'
                  : 'border-border/50 hover:border-purple-500/50'
              }
            >
              {cat}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((template, i) => (
            <motion.div
              key={template.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <Card className="glass border-border/30 hover:border-purple-500/30 transition-all duration-300 group overflow-hidden">
                {/* Template Preview */}
                <div className={`h-36 bg-gradient-to-br ${template.gradient} flex items-center justify-center relative`}>
                  <div className="text-white/80 group-hover:scale-110 transition-transform duration-300">
                    {template.icon}
                  </div>
                  {template.popular && (
                    <Badge className="absolute top-2 right-2 bg-white/20 text-white border-0 text-[10px] backdrop-blur-sm">
                      <TrendingUp className="h-2.5 w-2.5 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 text-[10px] text-white/80">
                    <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      <Clock className="h-2.5 w-2.5" /> {template.duration}
                    </span>
                    <span className="flex items-center gap-1 bg-black/20 px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {template.format}
                    </span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{template.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px] border-border/50">
                      {template.category}
                    </Badge>
                    <Button
                      size="sm"
                      className="h-7 text-xs bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
                      onClick={() => handleUseTemplate(template)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground">No se encontraron templates</p>
          <p className="text-xs text-muted-foreground mt-1">Intenta con otra busqueda o categoria</p>
        </div>
      )}
    </div>
  )
}
