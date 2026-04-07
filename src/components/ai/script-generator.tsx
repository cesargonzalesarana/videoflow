'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Wand2, Hash, Copy, Loader2, FileText, Lightbulb } from 'lucide-react'
import { toast } from 'sonner'

export function ScriptGenerator() {
  const [scriptPrompt, setScriptPrompt] = useState('')
  const [hashtagPrompt, setHashtagPrompt] = useState('')
  const [suggestionPrompt, setSuggestionPrompt] = useState('')
  const [scriptResult, setScriptResult] = useState('')
  const [hashtagResult, setHashtagResult] = useState('')
  const [suggestionResult, setSuggestionResult] = useState('')
  const [isScriptLoading, setIsScriptLoading] = useState(false)
  const [isHashtagLoading, setIsHashtagLoading] = useState(false)
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false)

  const generateScript = async () => {
    if (!scriptPrompt.trim()) return
    setIsScriptLoading(true)
    setScriptResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'script', prompt: scriptPrompt }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setScriptResult(data.script)
      }
    } catch {
      toast.error('Error al generar script')
    } finally {
      setIsScriptLoading(false)
    }
  }

  const generateHashtags = async () => {
    if (!hashtagPrompt.trim()) return
    setIsHashtagLoading(true)
    setHashtagResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hashtags', prompt: hashtagPrompt }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setHashtagResult(data.hashtags)
      }
    } catch {
      toast.error('Error al generar hashtags')
    } finally {
      setIsHashtagLoading(false)
    }
  }

  const generateSuggestions = async () => {
    if (!suggestionPrompt.trim()) return
    setIsSuggestionLoading(true)
    setSuggestionResult('')
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggestions', prompt: suggestionPrompt }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setSuggestionResult(data.suggestions)
      }
    } catch {
      toast.error('Error al generar sugerencias')
    } finally {
      setIsSuggestionLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado al portapapeles')
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-fuchsia-400" />
          IA Trends
        </h1>
        <p className="text-muted-foreground text-sm">Impulsa tu contenido con inteligencia artificial</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Script Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass border-border/30 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-400" />
                Generador de Scripts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Tema del video</Label>
                <Textarea
                  placeholder="Ej: Tutorial de programación en Python para principiantes, 60 segundos para TikTok..."
                  value={scriptPrompt}
                  onChange={(e) => setScriptPrompt(e.target.value)}
                  className="min-h-[80px] bg-background/50 border-border/50 text-sm"
                />
              </div>
              <Button
                onClick={generateScript}
                disabled={isScriptLoading || !scriptPrompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white"
              >
                {isScriptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generar Script
              </Button>
              <AnimatePresence>
                {scriptResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                      {scriptResult}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => copyToClipboard(scriptResult)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Hashtag Generator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="glass border-border/30 h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-fuchsia-400" />
                Generador de Hashtags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Tema o descripción del contenido</Label>
                <Textarea
                  placeholder="Ej: Videos de recetas rápidas para redes sociales..."
                  value={hashtagPrompt}
                  onChange={(e) => setHashtagPrompt(e.target.value)}
                  className="min-h-[80px] bg-background/50 border-border/50 text-sm"
                />
              </div>
              <Button
                onClick={generateHashtags}
                disabled={isHashtagLoading || !hashtagPrompt.trim()}
                className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white"
              >
                {isHashtagLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Hash className="mr-2 h-4 w-4" />}
                Generar Hashtags
              </Button>
              <AnimatePresence>
                {hashtagResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
                      <div className="flex flex-wrap gap-2">
                        {hashtagResult.split(' ').filter(Boolean).map((tag, i) => (
                          <Badge key={i} variant="secondary" className="bg-purple-500/10 text-purple-300 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => copyToClipboard(hashtagResult)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass border-border/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-400" />
                Sugerencias de Contenido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Textarea
                  placeholder="Describe tu nicho o qué tipo de contenido creas..."
                  value={suggestionPrompt}
                  onChange={(e) => setSuggestionPrompt(e.target.value)}
                  className="min-h-[60px] bg-background/50 border-border/50 text-sm flex-1"
                />
                <Button
                  onClick={generateSuggestions}
                  disabled={isSuggestionLoading || !suggestionPrompt.trim()}
                  className="bg-gradient-to-r from-amber-600 to-fuchsia-600 hover:from-amber-500 hover:to-fuchsia-500 text-white h-auto px-6"
                >
                  {isSuggestionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                </Button>
              </div>
              <AnimatePresence>
                {suggestionResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative"
                  >
                    <div className="p-4 rounded-lg bg-muted/30 border border-border/30 text-sm whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                      {suggestionResult}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => copyToClipboard(suggestionResult)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
