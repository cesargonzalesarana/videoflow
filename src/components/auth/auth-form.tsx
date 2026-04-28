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
import { createClient } from '@/lib/supabase/client'

export function AuthForm() {
  const [isRegister, setIsRegister] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAppStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      if (isRegister) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        })
        if (error) { toast.error(error.message || 'Error en el registro'); return }

        if (data.session) {
          const user = data.user!
          login({ id: user.id, email: user.email!, name: name })
          toast.success('¡Bienvenido, ' + name + '!')
        } else {
          toast.success('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.')
          return
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { toast.error(error.message || 'Credenciales invalidas'); return }

        const user = data.user!
        login({
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || user.email!
        })
        toast.success('¡Bienvenido de nuevo, ' + (user.user_metadata?.name || user.email) + '!')
      }

      // Sync user profile to database in background
      fetch('/api/auth').catch(() => {})
    } catch {
      toast.error('Error de conexion. Intenta de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast.error(error.message || `Error al conectar con ${provider === 'google' ? 'Google' : 'GitHub'}`)
        setIsLoading(false)
      }
    } catch {
      toast.error('Error de conexion. Intenta de nuevo.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero / Auth Section */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left - Hero */}
        <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-16 relative overflow-hidden">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-purple-500/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[100px]" />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="relative z-10 max-w-lg"
          >
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
              <span className="gradient-text">programa su publicacion</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Todo gratis, desde tu navegador. Impulsa tu contenido con IA y alcanza mas publico.
            </p>

            <div className="flex items-center gap-4">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20" onClick={() => document.getElementById('auth-card')?.scrollIntoView({ behavior: 'smooth' })}>
                Comenzar Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

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
                <p className="text-sm text-muted-foreground">Valoracion</p>
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
                    Iniciar Sesion
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
                            ? 'Empieza a crear contenido increible'
                            : 'Inicia sesion para continuar'}
                        </CardDescription>
                      </div>

                      {/* OAuth Buttons */}
                      <div className="space-y-3 mb-6">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11 bg-background/50 border-border/50 hover:bg-muted/50 justify-center"
                          onClick={() => handleOAuthLogin('google')}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                          </svg>
                          Continuar con Google
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-11 bg-background/50 border-border/50 hover:bg-muted/50 justify-center"
                          onClick={() => handleOAuthLogin('github')}
                          disabled={isLoading}
                        >
                          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          Continuar con GitHub
                        </Button>
                      </div>

                      {/* Divider */}
                      <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border/50" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">O usa tu email</span>
                        </div>
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
                          <Label htmlFor="password">Contrasena</Label>
                          <div className="relative">
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="--------"
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
                          {isRegister ? 'Crear Cuenta' : 'Iniciar Sesion'}
                        </Button>
                      </form>

                      {!isRegister && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
                          <p className="text-xs text-muted-foreground text-center">
                            Demo: Usa cualquier email y contrasena (minimo 6 caracteres)
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
                title: 'Programar Publicacion',
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

      <footer className="border-t border-border/30 px-6 py-6 text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 VideoFlow. Creado con amor para creadores de contenido.
        </p>
      </footer>
    </div>
  )
}
