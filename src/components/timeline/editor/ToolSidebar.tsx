'use client'

import React from 'react'
import {
  FolderOpen,
  Type,
  Music,
  Film,
  ImageIcon,
  Mic,
  Circle,
  HelpCircle
} from 'lucide-react'

export type ToolType = 'media' | 'text' | 'audio' | 'videos' | 'images' | 'tts' | 'record'

interface ToolSidebarProps {
  activeTool: ToolType
  onToolChange: (tool: ToolType) => void
}

const tools: { id: ToolType; icon: React.ElementType; label: string; shortcut?: string }[] = [
  { id: 'media', icon: FolderOpen, label: 'Medios', shortcut: '1' },
  { id: 'text', icon: Type, label: 'Texto', shortcut: '2' },
  { id: 'audio', icon: Music, label: 'Audio', shortcut: '3' },
  { id: 'videos', icon: Film, label: 'Videos', shortcut: '4' },
  { id: 'images', icon: ImageIcon, label: 'Imagenes', shortcut: '5' },
  { id: 'tts', icon: Mic, label: 'TTS', shortcut: '6' },
  { id: 'record', icon: Circle, label: 'Grabar', shortcut: '7' },
]

export function ToolSidebar({ activeTool, onToolChange }: ToolSidebarProps) {
  return (
    <div className="w-[56px] flex-shrink-0 bg-[#0c0c20] border-r border-white/5 flex flex-col items-center py-2 gap-0.5">
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`relative group w-[42px] h-[42px] rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all duration-150 cursor-pointer ${isActive ? 'bg-blue-500/15 text-blue-400' : 'text-white/40 hover:text-white/70 hover:bg-white/5'}`}
            title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
          >
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />}
            <Icon className={`h-[18px] w-[18px] ${tool.id === 'record' && isActive ? 'text-red-400' : ''}`} />
            <span className="text-[8px] leading-none font-medium">{tool.label}</span>
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a2e] border border-white/10 rounded-md text-[10px] text-white/80 whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-lg pointer-events-none">
              {tool.label}
              {tool.shortcut && <span className="ml-2 text-white/30">{tool.shortcut}</span>}
            </div>
          </button>
        )
      })}
      <div className="mt-auto flex flex-col items-center gap-0.5 pt-2 border-t border-white/5 w-full px-1.5">
        <button className="w-[42px] h-[42px] rounded-lg flex flex-col items-center justify-center gap-0.5 text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer" title="Ayuda">
          <HelpCircle className="h-[18px] w-[18px]" />
          <span className="text-[8px] leading-none font-medium">Ayuda</span>
        </button>
      </div>
    </div>
  )
}