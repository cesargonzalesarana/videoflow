'use client'

import React from 'react'
import { useTimelineStore } from '@/lib/timeline-store'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Trash2, Copy, Scissors, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

export function PropertiesPanel() {
  const selectedClipId = useTimelineStore((s) => s.selectedClipId)
  const clips = useTimelineStore((s) => s.clips)
  const updateClip = useTimelineStore((s) => s.updateClip)
  const removeClip = useTimelineStore((s) => s.removeClip)
  const splitClip = useTimelineStore((s) => s.splitClip)
  const duplicateClip = useTimelineStore((s) => s.duplicateClip)

  const clip = clips.find((c) => c.id === selectedClipId)

  const update = (updates: Record<string, unknown>) => {
    if (!clip) return
    updateClip(clip.id, updates)
  }

  if (!clip) {
    return (
      <div className="w-full h-full flex flex-col bg-[#0a0a1f]">
        <div className="p-3 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white/80">Propiedades</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-2">
              <Scissors className="h-4 w-4 text-white/20" />
            </div>
            <p className="text-xs text-white/30">Selecciona un clip para ver sus propiedades</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f]">
      {/* Header */}
      <div className="p-3 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white/80">Propiedades</h3>
            <p className="text-[10px] text-white/40 mt-0.5">{clip.type.toUpperCase()} - {clip.name}</p>
          </div>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={() => duplicateClip(clip.id)} title="Duplicar">
              <Copy className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10" onClick={() => { splitClip(clip.id, clip.startTime + clip.duration / 2); toast.success('Clip dividido') }} title="Dividir">
              <Scissors className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/50 hover:text-red-400 hover:bg-red-400/10" onClick={() => { removeClip(clip.id); toast.success('Clip eliminado') }} title="Eliminar">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content with native scroll instead of ScrollArea */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3 space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/50 uppercase tracking-wider">Nombre</Label>
            <Input value={clip.name} onChange={(e) => update({ name: e.target.value })} className="h-8 text-xs bg-white/5 border-white/10 text-white" />
          </div>

          {/* Timing */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/50 uppercase tracking-wider">Tiempo</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[9px] text-white/30">Inicio (s)</Label>
                <Input type="number" value={clip.startTime.toFixed(1)} onChange={(e) => update({ startTime: Math.max(0, parseFloat(e.target.value) || 0) })} className="h-7 text-xs bg-white/5 border-white/10 text-white" step={0.1} min={0} />
              </div>
              <div>
                <Label className="text-[9px] text-white/30">Duracion (s)</Label>
                <Input type="number" value={clip.duration.toFixed(1)} onChange={(e) => update({ duration: Math.max(0.5, parseFloat(e.target.value) || 0.5) })} className="h-7 text-xs bg-white/5 border-white/10 text-white" step={0.1} min={0.5} />
              </div>
            </div>
          </div>

          {/* Volume */}
          {(clip.type === 'video' || clip.type === 'audio') && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/50 uppercase tracking-wider">Volumen</Label>
              <div className="flex items-center gap-2">
                <Slider value={[clip.volume]} onValueChange={(v) => update({ volume: v[0] })} max={200} min={0} step={1} className="flex-1" />
                <span className="text-[10px] text-white/50 font-mono w-8 text-right">{clip.volume}%</span>
              </div>
            </div>
          )}

          {/* Opacity */}
          {(clip.type === 'video' || clip.type === 'image' || clip.type === 'text') && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/50 uppercase tracking-wider">Opacidad</Label>
              <div className="flex items-center gap-2">
                <Slider value={[clip.opacity]} onValueChange={(v) => update({ opacity: v[0] })} max={100} min={0} step={1} className="flex-1" />
                <span className="text-[10px] text-white/50 font-mono w-8 text-right">{clip.opacity}%</span>
              </div>
            </div>
          )}

          {/* Scale */}
          {(clip.type === 'video' || clip.type === 'image') && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/50 uppercase tracking-wider">Escala</Label>
              <div className="flex items-center gap-2">
                <Slider value={[clip.scale]} onValueChange={(v) => update({ scale: v[0] })} max={200} min={10} step={1} className="flex-1" />
                <span className="text-[10px] text-white/50 font-mono w-8 text-right">{clip.scale}%</span>
              </div>
            </div>
          )}

          {/* Text */}
          {clip.type === 'text' && (
            <div className="space-y-1.5">
              <Label className="text-[10px] text-white/50 uppercase tracking-wider">Contenido del Texto</Label>
              <Textarea value={clip.text || ''} onChange={(e) => update({ text: e.target.value })} className="min-h-[60px] text-xs bg-white/5 border-white/10 text-white" rows={3} />
            </div>
          )}

          {/* Transition */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/50 uppercase tracking-wider">Transicion</Label>
            <Select value={clip.transition} onValueChange={(v) => update({ transition: v })}>
              <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguna</SelectItem>
                <SelectItem value="fade">Fade</SelectItem>
                <SelectItem value="slide-left">Deslizar Izquierda</SelectItem>
                <SelectItem value="slide-right">Deslizar Derecha</SelectItem>
                <SelectItem value="dissolve">Disolver</SelectItem>
                <SelectItem value="zoom-in">Zoom In</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter */}
          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/50 uppercase tracking-wider">Filtro</Label>
            <Select value={clip.filter} onValueChange={(v) => update({ filter: v })}>
              <SelectTrigger className="h-8 text-xs bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Ninguno</SelectItem>
                <SelectItem value="grayscale">Escala de Grises</SelectItem>
                <SelectItem value="sepia">Sepia</SelectItem>
                <SelectItem value="blur">Desenfoque</SelectItem>
                <SelectItem value="brightness-up">Brillo+</SelectItem>
                <SelectItem value="contrast-up">Contraste+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reset */}
          <div className="pt-2 border-t border-white/5">
            <Button variant="ghost" size="sm" className="w-full text-xs text-white/40 hover:text-white/60" onClick={() => { update({ volume: 100, opacity: 100, scale: 100, positionX: 50, positionY: 50, transition: 'none', filter: 'none' }); toast.success('Propiedades reiniciadas') }}>
              <RotateCcw className="h-3 w-3 mr-1.5" />
              Reiniciar Propiedades
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}