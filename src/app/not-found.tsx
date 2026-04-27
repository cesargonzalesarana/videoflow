import Link from 'next/link'
import { FileQuestion, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060612] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/5 flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="h-10 w-10 text-violet-400" />
        </div>
        <h1 className="text-6xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent mb-4">404</h1>
        <h2 className="text-xl font-semibold text-white/80 mb-2">Pagina no encontrada</h2>
        <p className="text-white/40 mb-8 max-w-md mx-auto">La pagina que buscas no existe o fue movida a otra ubicacion.</p>
        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm font-medium shadow-lg shadow-violet-500/20 transition-all">
          <Home className="h-4 w-4" />
          Ir al Inicio
        </Link>
      </div>
    </div>
  )
}
