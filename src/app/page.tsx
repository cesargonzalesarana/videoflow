'use client'

import { useState } from 'react'
import { VideoCreator } from '@/components/video/video-creator'

export default function Home() {
  const [showEditor, setShowEditor] = useState(false)

  if (showEditor) {
    return <VideoCreator />
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
            VF
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            VideoFlow
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">Bienvenido</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">Crea y Programa Videos</h2>
          <p className="text-gray-400 text-lg">Editor de video profesional directamente en tu navegador</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors">
            <div className="text-3xl mb-3">🎬</div>
            <h3 className="font-semibold mb-2">Editor de Video</h3>
            <p className="text-sm text-gray-400">Timeline profesional con 4 pistas, efectos y transiciones</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold mb-2">Programación</h3>
            <p className="text-sm text-gray-400">Agenda la publicación de tus videos en redes sociales</p>
          </div>
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-colors">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold mb-2">Asistente IA</h3>
            <p className="text-sm text-gray-400">Genera contenido y subtitulos con inteligencia artificial</p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowEditor(true)}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-lg transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-105"
          >
            Abrir Editor de Video
          </button>
        </div>
      </div>
    </main>
  )
}