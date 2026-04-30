'use client'

import React from 'react'
import { ToolType } from './ToolSidebar'
import { MediaPanel } from './MediaPanel'

interface ToolPanelProps {
  activeTool: ToolType
}

function TextToolPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f]">
      <div className="p-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/80">Texto</h3>
        <p className="text-[10px] text-white/30 mt-0.5">Agrega titulos, subtitulos y textos animados</p>
      </div>
      <div className="flex-1 p-3 space-y-3">
        <div className="space-y-2">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Plantillas de Texto</p>
          {[
            { name: 'Titulo Principal', desc: 'Texto grande centrado' },
            { name: 'Subtitulo', desc: 'Texto mediano inferior' },
            { name: 'Leyenda', desc: 'Texto pequeno con fondo' },
            { name: 'Titulos Animados', desc: 'Texto con entrada animada' },
            { name: 'Creditos', desc: 'Texto de cierre tipo creditos' },
            { name: 'Subtitulo de Video', desc: 'Subtitulo para dialogos' },
          ].map((preset) => (
            <button key={preset.name} className="w-full text-left p-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-12 h-8 rounded bg-white/5 flex items-center justify-center flex-shrink-0">
                  <span className="text-white/50 text-xs font-bold">Aa</span>
                </div>
                <div>
                  <p className="text-xs text-white/70 group-hover:text-white/90">{preset.name}</p>
                  <p className="text-[9px] text-white/30">{preset.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function AudioToolPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f]">
      <div className="p-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/80">Audio</h3>
        <p className="text-[10px] text-white/30 mt-0.5">Musica, efectos de sonido y grabaciones</p>
      </div>
      <div className="flex-1 p-3 space-y-3">
        <div className="space-y-2">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Biblioteca de Audio</p>
          {[
            { name: 'Musica de Fondo', desc: 'Canciones instrumentales', icon: '🎵' },
            { name: 'Efectos de Sonido', desc: 'SFX para tu video', icon: '💥' },
            { name: 'Audio Ambiental', desc: 'Sonidos de entorno', icon: '🌊' },
            { name: 'Transiciones de Audio', desc: 'Fundidos y cortes', icon: '🔊' },
          ].map((cat) => (
            <button key={cat.name} className="w-full text-left p-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 text-lg">{cat.icon}</div>
                <div>
                  <p className="text-xs text-white/70 group-hover:text-white/90">{cat.name}</p>
                  <p className="text-[9px] text-white/30">{cat.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="pt-3 border-t border-white/5">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium mb-2">Acciones</p>
          <div className="space-y-1.5">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/3 hover:bg-white/5 text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer">Grabar voz en linea</button>
            <button className="w-full text-left px-3 py-2 rounded-lg bg-white/3 hover:bg-white/5 text-xs text-white/50 hover:text-white/70 transition-colors cursor-pointer">Importar archivo de audio</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TTSPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f]">
      <div className="p-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/80">Texto a Voz</h3>
        <p className="text-[10px] text-white/30 mt-0.5">Convierte texto en voz narrada con IA</p>
      </div>
      <div className="flex-1 p-3 space-y-3">
        <div className="space-y-2">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Estilos de Voz</p>
          {[
            { name: 'Narrador Profesional', desc: 'Voz formal, ideal para documentales', lang: 'Espanol' },
            { name: 'Voz Juvenil', desc: 'Voz fresca y dinamica', lang: 'Espanol' },
            { name: 'Narrador Ingles', desc: 'Professional English narrator', lang: 'English' },
            { name: 'Voz Amigable', desc: 'Tono calido y cercano', lang: 'Espanol' },
          ].map((voice) => (
            <button key={voice.name} className="w-full text-left p-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-blue-500/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-purple-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
                </div>
                <div>
                  <p className="text-xs text-white/70 group-hover:text-white/90">{voice.name}</p>
                  <p className="text-[9px] text-white/30">{voice.desc}</p>
                  <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">{voice.lang}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function RecordPanel() {
  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a1f]">
      <div className="p-3 border-b border-white/5">
        <h3 className="text-sm font-semibold text-white/80">Grabacion</h3>
        <p className="text-[10px] text-white/30 mt-0.5">Graba video o audio directamente</p>
      </div>
      <div className="flex-1 p-3 space-y-3">
        <div className="flex flex-col items-center justify-center py-8">
          <button className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/20 hover:border-red-500/50 flex items-center justify-center transition-all group cursor-pointer mb-4">
            <div className="w-8 h-8 rounded-full bg-red-500/60 group-hover:bg-red-500 transition-colors" />
          </button>
          <p className="text-sm text-white/60">Presiona para grabar</p>
          <p className="text-[10px] text-white/30 mt-1">Camara + Microfono</p>
        </div>
        <div className="space-y-2">
          <p className="text-[10px] text-white/50 uppercase tracking-wider font-medium">Opciones</p>
          {[
            { name: 'Grabar Pantalla', desc: 'Captura tu pantalla completa' },
            { name: 'Grabar Webcam', desc: 'Usa tu camara web' },
            { name: 'Grabar Solo Audio', desc: 'Grabacion de voz' },
          ].map((opt) => (
            <button key={opt.name} className="w-full text-left p-3 rounded-lg bg-white/3 hover:bg-white/5 border border-white/5 hover:border-red-500/20 transition-all group cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-400/50" />
                </div>
                <div>
                  <p className="text-xs text-white/70 group-hover:text-white/90">{opt.name}</p>
                  <p className="text-[9px] text-white/30">{opt.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ToolPanel({ activeTool }: ToolPanelProps) {
  switch (activeTool) {
    case 'media': return <MediaPanel initialFilter="all" />
    case 'text': return <TextToolPanel />
    case 'audio': return <MediaPanel initialFilter="audio" />
    case 'videos': return <MediaPanel initialFilter="video" />
    case 'images': return <MediaPanel initialFilter="image" />
    case 'tts': return <TTSPanel />
    case 'record': return <RecordPanel />
    default: return <MediaPanel initialFilter="all" />
  }
}