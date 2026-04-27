'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion, AnimatePresence } from 'framer-motion'
import { Video, Calendar, Sparkles, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export function AuthForm() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const { login } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const action = isRegister ? 'register' : 'login'
      const body = isRegister ? { action, name, email, password } : { action, email, password }

      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Error en la autenticación')
        return
      }

      login(data.user)
      toast.success(`¡Bienvenido${isRegister ? '' : ' de nuevo'}, ${data.user.name}!`)
    } catch {
      toast.error('Error de conexión. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async function() {
    if (!forgotEmail) {
      toast.error('Ingresa tu email')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Error al enviar enlace'); return }
      toast.success('Se envio el enlace de recuperacion a tu email')
      setShowForgot(false)
    } catch {
      toast.error('Error de conexion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero / Auth Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left - Hero */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 relative overflow-hidden">
          {/* Background gradient blobs */}
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[100px]" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-lg"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Video className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="gradient-text">VideoFlow</span>
              </h1>
            </div>

            <h2 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
              Crea videos profesionales y{' '}
              <span className="gradient-text">programa su publicación</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Todo gratis, desde tu navegador. Impulsa tu contenido con IA y alcanza más público.
            </p>

            <div className="flex items-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20" onClick={() => document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' })}>
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8 mt-12">
              <div>
                <p className="text-2xl font-bold gradient-text">10K+</p>
                <p className="text-sm text-muted-foreground">Creadores</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="text-2xl font-bold gradient-text">50K+</p>
                <p className="text-sm text-muted-foreground">Videos Creados</p>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <p className="text-2xl font-bold gradient-text">4.9★</p>
                <p className="text-sm text-muted-foreground">Valoración</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right - Auth Form */}
        <div className="flex items-center justify-center px-6 py-12 lg:px-16">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="w-full max-w-md"
            id="auth-card"
          >
            <Card className="glass-strong shadow-2xl shadow-purple-500/5">
              <Tabs value={isRegister ? 'register' : 'login'} onValueChange={(v) => setIsRegister(v === 'register')}>
                <TabsList className="w-full bg-muted/50 h-12 p-1 mb-6">
                  <TabsTrigger
                    value="login"
                    className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Iniciar Sesión
                  </TabsTrigger>
                  <TabsTrigger
                    value="register"
                    className="flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-fuchsia-600 data-[state=active]:text-white data-[state=active]:shadow-md"
                  >
                    Registrarse
                  </TabsTrigger>
                </TabsList>

                <CardContent className="px-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={isRegister ? 'register' : 'login'}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-center mb-6">
                        <CardTitle className="text-xl">
                          {isRegister ? 'Crear Cuenta' : 'Bienvenido de Vuelta'}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {isRegister
                            ? 'Empieza a crear contenido increíble'
                            : 'Inicia sesión para continuar'}
                        </CardDescription>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-4">
                        <AnimatePresence>
                          {isRegister && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="space-y-2 mb-4">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                  id="name"
                                  placeholder="Tu nombre"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  required
                                  className="bg-background/50 border-border/50 focus:border-purple-500/50"
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-background/50 border-border/50 focus:border-purple-500/50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="password">Contraseña</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="bg-background/50 border-border/50 focus:border-purple-500/50 pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </Button>
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 h-11"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                        </Button>
                      </form>

                        {!isRegister && !showForgot && (
                          <button type='button' onClick={function() { setShowForgot(true) }} className='w-full text-center text-sm text-purple-400 hover:text-purple-300 mt-2 transition-colors'>Olvidaste tu contrasena?</button>
                        )}

                      {!isRegister && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                          <p className="text-xs text-muted-foreground text-center">
                            Demo: Usa cualquier email y contraseña (mínimo 6 caracteres)
                          </p>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </CardContent>
              </Tabs>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Features section */}
      <div className="px-6 py-16 lg:px-16 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[150px]" />
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-center mb-10">
            Todo lo que necesitas para{' '}
            <span className="gradient-text">crear contenido viral</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: <Video className="h-6 w-6" />,
                title: 'Crear Videos',
                description: 'Editor intuitivo con timeline, overlays de texto y templates profesionales. Sin descargar nada.',
                gradient: 'from-purple-500/20 to-purple-500/5',
                iconBg: 'bg-purple-500/10 text-purple-400',
              },
              {
                icon: <Calendar className="h-6 w-6" />,
                title: 'Programar Publicación',
                description: ' Programa videos en YouTube, TikTok, Instagram y Facebook desde un solo lugar.',
                gradient: 'from-fuchsia-500/20 to-fuchsia-500/5',
                iconBg: 'bg-fuchsia-500/10 text-fuchsia-400',
              },
              {
                icon: <Sparkles className="h-6 w-6" />,
                title: 'IA Trends',
                description: 'Descubre tendencias, genera scripts con IA y obtén hashtags que aumenten tu alcance.',
                gradient: 'from-violet-500/20 to-violet-500/5',
                iconBg: 'bg-violet-500/10 text-violet-400',
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <Card className={`glass border-border/30 hover:border-purple-500/30 transition-all duration-300 group`}>
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 VideoFlow. Creado con 💜 para creadores de contenido.
        </p>
      </footer>
    </div>
  )
}
