'use client'

import { useTimelineStore } from '@/lib/timeline-store'

export function PropertiesPanel() {
  const { tracks, selectedClipId, updateClip, removeClip } = useTimelineStore()

  const selectedClip = tracks
    .flatMap((t) => t.clips)
    .find((c) => c.id === selectedClipId)

  if (!selectedClip) {
    return (
      <div className="w-56 flex-shrink-0 bg-[#16162a] border-l border-[#2a2a4a] flex flex-col">
        <div className="p-3 border-b border-[#2a2a4a]">
          <h2 className="text-sm font-semibold text-gray-200">Propiedades</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-[11px] text-gray-500 text-center">
            Selecciona un clip para ver sus propiedades
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-56 flex-shrink-0 bg-[#16162a] border-l border-[#2a2a4a] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[#2a2a4a]">
        <h2 className="text-sm font-semibold text-gray-200">Propiedades</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Nombre</label>
          <input
            value={selectedClip.name}
            onChange={(e) => updateClip(selectedClip.id, { name: e.target.value })}
            className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Inicio (seg)</label>
          <input
            type="number"
            value={selectedClip.startTime.toFixed(2)}
            onChange={(e) => updateClip(selectedClip.id, { startTime: Number(e.target.value) })}
            step="0.1"
            className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Duración (seg)</label>
          <input
            type="number"
            value={selectedClip.duration.toFixed(2)}
            onChange={(e) => updateClip(selectedClip.id, { duration: Math.max(0.1, Number(e.target.value)) })}
            step="0.1"
            className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Volumen</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedClip.volume ?? 1}
            onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
            className="w-full mt-1 accent-purple-500"
          />
          <span className="text-[10px] text-gray-400">{Math.round((selectedClip.volume ?? 1) * 100)}%</span>
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Opacidad</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedClip.opacity ?? 1}
            onChange={(e) => updateClip(selectedClip.id, { opacity: Number(e.target.value) })}
            className="w-full mt-1 accent-purple-500"
          />
          <span className="text-[10px] text-gray-400">{Math.round((selectedClip.opacity ?? 1) * 100)}%</span>
        </div>

        {selectedClip.type === 'text' && (
          <>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Texto</label>
              <textarea
                value={selectedClip.text}
                onChange={(e) => updateClip(selectedClip.id, { text: e.target.value })}
                rows={3}
                className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Tamaño fuente</label>
              <input
                type="number"
                value={selectedClip.fontSize ?? 32}
                onChange={(e) => updateClip(selectedClip.id, { fontSize: Number(e.target.value) })}
                className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Color</label>
              <input
                type="color"
                value={selectedClip.color ?? '#ffffff'}
                onChange={(e) => updateClip(selectedClip.id, { color: e.target.value })}
                className="w-full mt-1 h-8 bg-[#1a1a3a] border border-[#2a2a4a] rounded cursor-pointer"
              />
            </div>
          </>
        )}

        <button
          onClick={() => removeClip(selectedClip.id)}
          className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium transition-colors mt-4"
        >
          Eliminar clip
        </button>
      </div>
    </div>
  )
}