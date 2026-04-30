'use client'

import {
  Upload, FolderOpen, Type, Music, Film, Image as ImageIcon,
  Puzzle, Mic, Volume2
} from 'lucide-react'

const tools = [
  { id: 'upload', icon: Upload, label: 'Subir' },
  { id: 'media', icon: FolderOpen, label: 'Medios' },
  { id: 'text', icon: Type, label: 'Texto' },
  { id: 'audio', icon: Music, label: 'Audio' },
  { id: 'videos', icon: Film, label: 'Videos' },
  { id: 'images', icon: ImageIcon, label: 'Imagenes' },
  { id: 'elements', icon: Puzzle, label: 'Elementos' },
  { id: 'record', icon: Mic, label: 'Grabar' },
  { id: 'tts', icon: Volume2, label: 'TTS' },
]

interface ToolBarProps {
  activeTool: string
  onToolChange: (tool: string) => void
}

export function ToolBar({ activeTool, onToolChange }: ToolBarProps) {
  return (
    <div className="w-14 bg-[#12132a] border-r border-[#2a2a4a] flex flex-col items-center py-2 gap-1 flex-shrink-0">
      {tools.map((tool) => {
        const Icon = tool.icon
        const isActive = activeTool === tool.id
        return (
          <button
            key={tool.id}
            onClick={() => onToolChange(tool.id)}
            className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all ${
              isActive
                ? 'bg-purple-600/20 text-purple-400'
                : 'text-gray-500 hover:bg-[#2a2a4a] hover:text-gray-300'
            }`}
            title={tool.label}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[8px] leading-none">{tool.label}</span>
          </button>
        )
      })}
    </div>
  )
}
