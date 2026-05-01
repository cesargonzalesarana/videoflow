'use client'

import { useTimelineStore } from '@/lib/timeline-store'

export function PropertiesPanel() {
  const store = useTimelineStore()

  // ✅ GUARD: leer tracks con null-safe
  const rawTracks = store.tracks

  const selectedClip = (() => {
    try {
      if (!Array.isArray(rawTracks)) return undefined
      return rawTracks
        .filter((t) => t != null && Array.isArray(t.clips))
        .flatMap((t) => t.clips.filter((c) => c != null))
        .find((c) => c.id === store.selectedClipId)
    } catch {
      return undefined
    }
  })()

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

  const updateClip = store.updateClip
  const removeClip = store.removeClip
  const splitClip = store.splitClip
  const duplicateClip = store.duplicateClip

  return (
    <div className="w-56 flex-shrink-0 bg-[#16162a] border-l border-[#2a2a4a] flex flex-col overflow-hidden">
      <div className="p-3 border-b border-[#2a2a4a]">
        <h2 className="text-sm font-semibold text-gray-200">Propiedades</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Nombre</label>
          <input
            value={selectedClip.name || ''}
            onChange={(e) => updateClip(selectedClip.id, { name: e.target.value })}
            className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Tipo</label>
          <div className="mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-gray-300">
            {selectedClip.type === 'video' ? '🎬 Video' : selectedClip.type === 'audio' ? '🔊 Audio' : selectedClip.type === 'text' ? '📝 Texto' : '🖼️ Imagen'}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Inicio (s)</label>
            <input
              type="number"
              value={(selectedClip.startTime || 0).toFixed(2)}
              onChange={(e) => updateClip(selectedClip.id, { startTime: Number(e.target.value) })}
              step="0.1"
              className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-gray-500 uppercase tracking-wider">Duracion (s)</label>
            <input
              type="number"
              value={(selectedClip.duration || 0).toFixed(2)}
              onChange={(e) => updateClip(selectedClip.id, { duration: Math.max(0.1, Number(e.target.value)) })}
              step="0.1"
              className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Volumen: {Math.round((selectedClip.volume ?? 1) * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedClip.volume ?? 1}
            onChange={(e) => updateClip(selectedClip.id, { volume: Number(e.target.value) })}
            className="w-full mt-1 accent-purple-500"
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Opacidad: {Math.round((selectedClip.opacity ?? 1) * 100)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={selectedClip.opacity ?? 1}
            onChange={(e) => updateClip(selectedClip.id, { opacity: Number(e.target.value) })}
            className="w-full mt-1 accent-purple-500"
          />
        </div>

        <div className="border-t border-[#2a2a4a] pt-3">
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">Transiciones</label>
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Fade In</span>
                <span>{(selectedClip.fadeIn ?? 0).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={selectedClip.fadeIn ?? 0}
                onChange={(e) => updateClip(selectedClip.id, { fadeIn: Number(e.target.value) })}
                className="w-full accent-green-500"
              />
            </div>
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>Fade Out</span>
                <span>{(selectedClip.fadeOut ?? 0).toFixed(1)}s</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="0.1"
                value={selectedClip.fadeOut ?? 0}
                onChange={(e) => updateClip(selectedClip.id, { fadeOut: Number(e.target.value) })}
                className="w-full accent-orange-500"
              />
            </div>
          </div>
        </div>

        {selectedClip.type === 'text' && (
          <div className="border-t border-[#2a2a4a] pt-3">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-wider">Texto</label>
              <textarea
                value={selectedClip.text || ''}
                onChange={(e) => updateClip(selectedClip.id, { text: e.target.value })}
                rows={3}
                className="w-full mt-1 px-2 py-1 text-xs bg-[#1a1a3a] border border-[#2a2a4a] rounded text-white focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="text-[10px] text-gray-500 uppercase tracking-wider">Tamaño</label>
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
                  className="w-full mt-1 h-7 bg-[#1a1a3a] border border-[#2a2a4a] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-[#2a2a4a] pt-3 space-y-2">
          <button
            onClick={() => splitClip(selectedClip.id)}
            className="w-full py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            ✂️ Cortar en playhead (S)
          </button>
          <button
            onClick={() => duplicateClip(selectedClip.id)}
            className="w-full py-2 rounded-lg bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            📋 Duplicar (Ctrl+D)
          </button>
          <button
            onClick={() => removeClip(selectedClip.id)}
            className="w-full py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            🗑️ Eliminar (Del)
          </button>
        </div>
      </div>
    </div>
  )
}