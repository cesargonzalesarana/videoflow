'use client'

import React, { useState } from 'react'
import { AuthForm } from '@/components/auth/auth-form'
import { Button } from '@/components/ui/button'
import {
  Film, Upload, Calendar, Sparkles, Play, ArrowRight,
  Clock, Zap, Globe, CheckCircle2, ChevronRight
} from 'lucide-react'

const features = [
  {
    icon: Film,
    title: 'Editor de Video',
    description: 'Timeline intuitivo con pistas de video, audio, texto e imagenes. Arrastra y suelta para crear videos profesionales.',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: Upload,
    title: 'Almacenamiento en la Nube',
    description: 'Tus archivos se guardan de forma segura en Supabase Storage. Accede a tus medios desde cualquier dispositivo.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Calendar,
    title: 'Programacion de Publicaciones',
    description: 'Programa tus videos en YouTube, TikTok, Instagram y Facebook. Publica en el momento perfecto automaticamente.',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Sparkles,
    title: 'IA Asistente Creativa',
    description: 'Genera guiones, hashtags y titulos con inteligencia artificial. Descubre tendencias relevantes para tu contenido.',
    color: 'from-amber-500 to-orange-500',
  },
]

const steps = [
  {
    number: '01',
    title: 'Sube tus Medios',
    description: 'Importa videos, imagenes y audio desde tu computadora. Todo se guarda automaticamente en la nube.',
  },
  {
    number: '02',
    title: 'Edita en el Timeline',
    description: 'Organiza tus clips en pistas, agrega textos, ajusta transiciones y aplica filtros visuales.',
  },
  {
    number: '03',
    title: 'Exporta y Publica',
    description: 'Exporta en formato WebM y programa tu publicacion en multiples plataformas con un solo clic.',
  },
]

const stats = [
  { value: '4+', label: 'Plataformas' },
  { value: '500MB', label: 'Por archivo' },
  { value: 'IA', label: 'Asistente' },
  { value: 'Nube', label: 'Almacenamiento' },
]

export function LandingPage() {
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  const handleGetStarted = () => {
    setAuthMode('register')
    setShowAuth(true)
  }

  const handleLogin = () => {
    setAuthMode('login')
    setShowAuth(true)
  }

  if (showAuth) {
    return (
      <div className="min-h-screen relative">
        <button
          onClick={function() { setShowAuth(false) }}
          className="absolute top-4 left-4 z-50 text-white/60 hover:text-white flex items-center gap-1 text-sm transition-colors"
        >
          &larr; Volver
        </button>
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#060612] text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#060612]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Play className="h-4 w-4 text-white ml-0.5" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">VideoFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleLogin}
              className="text-white/60 hover:text-white hover:bg-white/5"
            >
              Iniciar Sesion
            </Button>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/20"
            >
              Comenzar Gratis
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs text-white/60">Creado con IA para creadores de contenido</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Crea videos profesionales
            <br />
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              sin complicaciones
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Editor de video online con inteligencia artificial. Sube, edita, exporta y programa tus publicaciones en multiples plataformas desde un solo lugar.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button
              size="lg"
              onClick={handleGetStarted}
              className="h-12 px-8 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
            >
              Empezar a Crear
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleLogin}
              className="h-12 px-8 text-base border-white/10 text-white/70 hover:bg-white/5 hover:text-white"
            >
              Ya tengo cuenta
            </Button>
          </div>
        </div>

        {/* Editor Preview */}
        <div className="max-w-5xl mx-auto mt-16 relative">
          <div className="rounded-xl border border-white/10 bg-[#0a0a1f] overflow-hidden shadow-2xl shadow-violet-500/10">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#080818]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-white/30">VideoFlow Editor</span>
            </div>
            <div className="aspect-video bg-gradient-to-br from-[#0a0a1a] to-[#080818] flex items-center justify-center relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-white/5 flex items-center justify-center mx-auto mb-3">
                    <Play className="h-7 w-7 text-violet-400 ml-1" />
                  </div>
                  <p className="text-sm text-white/30">Vista previa del editor</p>
                </div>
              </div>
              {/* Fake timeline */}
              <div className="absolute bottom-0 left-0 right-0 h-16 border-t border-white/5 bg-[#0a0a1f]">
                <div className="flex items-center h-full px-4 gap-2">
                  <div className="w-20 h-8 rounded bg-violet-500/20 border border-violet-500/30" />
                  <div className="w-32 h-8 rounded bg-pink-500/20 border border-pink-500/30" />
                  <div className="w-16 h-8 rounded bg-emerald-500/20 border border-emerald-500/30" />
                  <div className="w-24 h-8 rounded bg-amber-500/20 border border-amber-500/30" />
                </div>
              </div>
              {/* Fake playhead */}
              <div className="absolute bottom-0 left-1/3 top-0 w-px bg-fuchsia-500/50" />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-12 grid grid-cols-4 gap-4">
          {stats.map(function(stat) {
            return (
              <div key={stat.label} className="text-center p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <p className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="text-xs text-white/40 mt-1">{stat.label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Todo lo que necesitas para
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> crear contenido</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">Herramientas profesionales integradas en una plataforma sencilla y facil de usar.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map(function(feature) {
              return (
                <div key={feature.title} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all group">
                  <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + feature.color + " flex items-center justify-center mb-4 opacity-80 group-hover:opacity-100 transition-opacity"}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Como funciona
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">Tres simples pasos para llevar tu contenido al siguiente nivel.</p>
          </div>
          <div className="space-y-8">
            {steps.map(function(step) {
              return (
                <div key={step.number} className="flex items-start gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">{step.number}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-sm text-white/40 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-pink-500/10 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Empieza a crear contenido
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent"> ahora mismo</span>
              </h2>
              <p className="text-white/40 mb-8 max-w-lg mx-auto">Unete a creadores que usan VideoFlow para producir videos profesionales en minutos.</p>
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="h-12 px-10 text-base bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
              >
                Crear Cuenta Gratis
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 sm:px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Play className="h-3 w-3 text-white ml-0.5" />
            </div>
            <span className="text-sm font-semibold text-white/60">VideoFlow</span>
          </div>
          <p className="text-xs text-white/30">
            Creado con dedicacion para creadores de contenido
          </p>
        </div>
      </footer>
    </div>
  )
}
