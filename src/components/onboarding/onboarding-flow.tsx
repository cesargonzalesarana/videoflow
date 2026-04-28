'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, Video, Music, Image as ImageIcon, Megaphone,
  Youtube, Instagram, Twitter, Check, ChevronRight, ChevronLeft,
  Palette, Zap, Globe, Rocket, Heart, Star, ArrowRight, X
} from 'lucide-react'
import { toast } from 'sonner'

interface OnboardingStep {
  id: number
  title: string
  subtitle: string
  icon: React.ReactNode
}

const steps: OnboardingStep[] = [
  { id: 1, title: 'Bienvenido a VideoFlow', subtitle: 'Crea videos increibles con inteligencia artificial', icon: <Sparkles className="h-12 w-12" /> },
  { id: 2, title: 'Elige tu contenido', subtitle: 'Que tipo de videos quieres crear?', icon: <Video className="h-12 w-12" /> },
  { id: 3, title: 'Conecta tus redes', subtitle: 'Publica directamente en tus plataformas', icon: <Globe className="h-12 w-12" /> },
  { id: 4, title: 'Todo listo!', subtitle: 'Comienza a crear contenido increible', icon: <Rocket className="h-12 w-12" /> },
]

const contentTypes = [
  { id: 'youtube', label: 'YouTube', desc: 'Videos largos, tutoriales, vlogs', icon: <Youtube className="h-6 w-6" />, gradient: 'from-red-500 to-red-600' },
  { id: 'shorts', label: 'Shorts/Reels', desc: 'Contenido vertical viral', icon: <Video className="h-6 w-6" />, gradient: 'from-purple-500 to-pink-500' },
  { id: 'marketing', label: 'Marketing', desc: 'Promociones y anuncios', icon: <Megaphone className="h-6 w-6" />, gradient: 'from-blue-500 to-cyan-500' },
  { id: 'music', label: 'Musicales', desc: 'Clips musicales y covers', icon: <Music className="h-6 w-6" />, gradient: 'from-emerald-500 to-green-500' },
  { id: 'stories', label: 'Stories', desc: 'Contenido efimero para redes', icon: <ImageIcon className="h-6 w-6" />, gradient: 'from-amber-500 to-orange-500' },
  { id: 'podcast', label: 'Podcast', desc: 'Clips y highlights de audio', icon: <PodcastIcon />, gradient: 'from-violet-500 to-purple-600' },
]

const socialPlatforms = [
  { id: 'youtube', label: 'YouTube', icon: <Youtube className="h-5 w-5" />, color: 'hover:border-red-400/50 hover:bg-red-400/5' },
  { id: 'instagram', label: 'Instagram', icon: <InstagramIcon />, color: 'hover:border-pink-400/50 hover:bg-pink-400/5' },
  { id: 'tiktok', label: 'TikTok', icon: <Music className="h-5 w-5" />, color: 'hover:border-gray-400/50 hover:bg-gray-400/5' },
  { id: 'twitter', label: 'X / Twitter', icon: <Twitter className="h-5 w-5" />, color: 'hover:border-blue-400/50 hover:bg-blue-400/5' },
]

function PodcastIcon() {
  return <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1a4 4 0 0 0-4 4v7a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /></svg>
}

function InstagramIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" /></svg>
}

export function OnboardingFlow() {
  const { user } = useAppStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [userName, setUserName] = useState(user?.name || '')
  const [selectedContent, setSelectedContent] = useState<string[]>([])
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([])
  const [isClosing, setIsClosing] = useState(false)

  function toggleContent(id: string) {
    setSelectedContent(function(prev) {
      return prev.includes(id) ? prev.filter(function(c) { return c !== id }) : prev.concat([id])
    })
  }

  function togglePlatform(id: string) {
    setConnectedPlatforms(function(prev) {
      return prev.includes(id) ? prev.filter(function(p) { return p !== id }) : prev.concat([id])
    })
  }

  function nextStep() {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
    else finishOnboarding()
  }

  function prevStep() {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  function skipOnboarding() {
    setIsClosing(true)
    setTimeout(function() {
      localStorage.setItem('videoflow_onboarding_done', 'true')
      toast.success('Bienvenido a VideoFlow!')
    }, 300)
  }

  function finishOnboarding() {
    setIsClosing(true)
    setTimeout(function() {
      localStorage.setItem('videoflow_onboarding_done', 'true')
      if (userName) {
        localStorage.setItem('videoflow_onboarding_name', userName)
      }
      localStorage.setItem('videoflow_onboarding_content', JSON.stringify(selectedContent))
      toast.success('Configuracion completada! Empieza a crear')
    }, 300)
  }

  var progress = (currentStep / 4) * 100

  return (
    <AnimatePresence>
      {!isClosing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/95 via-[#0a0a1f]/95 to-fuchsia-900/95 backdrop-blur-xl" onClick={skipOnboarding} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-white/10"
          >
            <button onClick={skipOnboarding} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors">
              <X className="h-4 w-4" />
            </button>

            <div className="p-1 bg-gradient-to-r from-purple-500 to-fuchsia-500">
              <div className="bg-[#0a0a1f] rounded-t-[1.35rem] p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white/80">VideoFlow</span>
                  </div>
                  <span className="text-xs text-white/40">{currentStep} de {steps.length}</span>
                </div>

                <div className="h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
                  <motion.div className="h-full bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-full" animate={{ width: progress + '%' }} transition={{ duration: 0.5, ease: 'easeOut' }} />
                </div>

                <AnimatePresence mode="wait">
                  {currentStep === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-8">
                        <motion.div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-6 text-purple-400" animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                          {steps[0].icon}
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">{steps[0].title}</h2>
                        <p className="text-white/50">{steps[0].subtitle}</p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm text-white/60 mb-1.5 block">Como te llamas?</label>
                          <Input value={userName} onChange={function(e) { setUserName(e.target.value) }} placeholder="Tu nombre" className="bg-white/5 border-white/10 text-white placeholder:text-white/20 h-12" />
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {[{ icon: <Zap className="h-5 w-5" />, label: 'IA Avanzada', desc: 'Genera guiones con IA' },{ icon: <Palette className="h-5 w-5" />, label: 'Plantillas', desc: 'Mas de 50 plantillas' },{ icon: <Star className="h-5 w-5" />, label: 'Programar', desc: 'Agenda publicaciones' }].map(function(feat) {
                            return <div key={feat.label} className="glass rounded-xl p-3 text-center"><div className="text-purple-400 mb-2 flex justify-center">{feat.icon}</div><p className="text-xs font-medium text-white/80">{feat.label}</p><p className="text-[10px] text-white/40 mt-0.5">{feat.desc}</p></div>
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">{steps[1].icon}</div>
                        <h2 className="text-2xl font-bold text-white mb-2">{steps[1].title}</h2>
                        <p className="text-white/50">Selecciona uno o mas tipos de contenido</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {contentTypes.map(function(ct) {
                          var isSelected = selectedContent.includes(ct.id)
                          return (
                            <button key={ct.id} onClick={function() { toggleContent(ct.id) }} className={"relative p-4 rounded-xl border text-left transition-all " + (isSelected ? "border-purple-500/50 bg-purple-500/10" : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10")}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className={"w-10 h-10 rounded-lg bg-gradient-to-br " + ct.gradient + " flex items-center justify-center text-white/80"}>{ct.icon}</div>
                                <span className="text-sm font-semibold text-white/90">{ct.label}</span>
                              </div>
                              <p className="text-xs text-white/40">{ct.desc}</p>
                              {isSelected && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center"><Check className="h-3 w-3 text-white" /></div>}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 3 && (
                    <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-4 text-purple-400">{steps[2].icon}</div>
                        <h2 className="text-2xl font-bold text-white mb-2">{steps[2].title}</h2>
                        <p className="text-white/50">Selecciona las plataformas que usas (opcional)</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {socialPlatforms.map(function(sp) {
                          var isConnected = connectedPlatforms.includes(sp.id)
                          return (
                            <button key={sp.id} onClick={function() { togglePlatform(sp.id) }} className={"flex items-center gap-3 p-4 rounded-xl border transition-all " + (isConnected ? "border-purple-500/50 bg-purple-500/10" : "border-white/5 bg-white/[0.02] " + sp.color)}>
                              <div className="text-white/60">{sp.icon}</div>
                              <span className="text-sm font-medium text-white/80">{sp.label}</span>
                              {isConnected && <Check className="h-4 w-4 text-purple-400 ml-auto" />}
                            </button>
                          )
                        })}
                      </div>
                      <div className="glass rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2"><Heart className="h-4 w-4 text-pink-400" /><span className="text-xs font-medium text-white/70">Conecta mas tarde</span></div>
                        <p className="text-xs text-white/40">Puedes conectar tus redes sociales en cualquier momento desde Configuracion</p>
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 4 && (
                    <motion.div key="step4" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.3 }}>
                      <div className="text-center">
                        <motion.div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-fuchsia-500/20 flex items-center justify-center mx-auto mb-6 text-purple-400" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                          {steps[3].icon}
                        </motion.div>
                        <h2 className="text-2xl font-bold text-white mb-2">{userName ? 'Todo listo, ' + userName.split(' ')[0] + '!' : steps[3].title}</h2>
                        <p className="text-white/50 mb-8">Tu estudio de video esta configurado y listo para usar</p>
                        <div className="grid grid-cols-3 gap-3 mb-8">
                          <div className="glass rounded-xl p-3 text-center"><p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">12+</p><p className="text-[10px] text-white/40 mt-1">Plantillas</p></div>
                          <div className="glass rounded-xl p-3 text-center"><p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">IA</p><p className="text-[10px] text-white/40 mt-1">Generador</p></div>
                          <div className="glass rounded-xl p-3 text-center"><p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">4K</p><p className="text-[10px] text-white/40 mt-1">Export</p></div>
                        </div>
                        {selectedContent.length > 0 && (
                          <div className="flex items-center justify-center gap-2 flex-wrap">
                            <span className="text-xs text-white/40">Tus intereses:</span>
                            {selectedContent.map(function(id) {
                              var ct = contentTypes.find(function(c) { return c.id === id })
                              return ct ? <Badge key={id} className="text-xs bg-purple-500/15 text-purple-300 border-purple-500/20">{ct.label}</Badge> : null
                            })}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mt-8">
                  {currentStep > 1 ? (
                    <Button variant="ghost" onClick={prevStep} className="text-white/50 hover:text-white/80 hover:bg-white/5"><ChevronLeft className="h-4 w-4 mr-1" />Atras</Button>
                  ) : <div />}
                  <div className="flex items-center gap-2">
                    {currentStep < 4 && (
                      <button onClick={skipOnboarding} className="text-xs text-white/30 hover:text-white/50 px-3 py-1.5 transition-colors">Omitir</button>
                    )}
                    <Button onClick={nextStep} className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white gap-1.5">
                      {currentStep === 4 ? 'Comenzar' : 'Siguiente'}{currentStep === 4 ? <Rocket className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
