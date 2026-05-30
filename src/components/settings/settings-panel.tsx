'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import {
  Settings, User, Monitor, Bell, Link2, ExternalLink,
  Youtube, Instagram, Facebook, Save, Check
} from 'lucide-react'
import { toast } from 'sonner'

export function SettingsPanel() {
  const { user } = useAppStore()
  const [settings, setSettings] = useState({
    resolution: '1080p',
    format: 'mp4',
    fps: '30',
    notifications: {
      email: true,
      scheduled: true,
      published: false,
      trends: true,
    },
  })
  const [saved, setSaved] = useState(false)

  const platforms = [
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="h-5 w-5 text-red-400" />, connected: false, color: 'border-red-500/20 hover:border-red-500/40' },
    { id: 'tiktok', name: 'TikTok', icon: <Instagram className="h-5 w-5 text-pink-400" />, connected: false, color: 'border-pink-500/20 hover:border-pink-500/40' },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="h-5 w-5 text-orange-400" />, connected: false, color: 'border-orange-500/20 hover:border-orange-500/40' },
    { id: 'facebook', name: 'Facebook', icon: <Facebook className="h-5 w-5 text-blue-400" />, connected: false, color: 'border-blue-500/20 hover:border-blue-500/40' },
  ]

  const handleSave = () => {
    setSaved(true)
    toast.success('Configuración guardada')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-muted-foreground" />
          Configuración
        </h1>
        <p className="text-muted-foreground text-sm">Personaliza tu experiencia en VideoFlow</p>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-purple-400" />
              Información de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  defaultValue={user?.name || ''}
                  className="bg-background/50 border-border/50"
                  placeholder="Tu nombre"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  defaultValue={user?.email || ''}
                  type="email"
                  className="bg-background/50 border-border/50"
                  disabled
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">El email no puede ser cambiado.</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Connected Platforms */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Link2 className="h-4 w-4 text-fuchsia-400" />
              Plataformas Conectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {platforms.map((platform) => (
                <div
                  key={platform.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${platform.color} transition-all`}
                >
                  <div className="flex items-center gap-3">
                    {platform.icon}
                    <div>
                      <p className="text-sm font-medium">{platform.name}</p>
                      {platform.connected ? (
                        <p className="text-xs text-green-400">Conectado</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No conectado</p>
                      )}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    {platform.connected ? 'Gestionar' : 'Conectar'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Video Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Monitor className="h-4 w-4 text-purple-400" />
              Configuración de Video
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Resolución</Label>
                <Select value={settings.resolution} onValueChange={(v) => setSettings({ ...settings, resolution: v })}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="720p">720p (HD)</SelectItem>
                    <SelectItem value="1080p">1080p (Full HD)</SelectItem>
                    <SelectItem value="1440p">1440p (2K)</SelectItem>
                    <SelectItem value="4k">4K (Ultra HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Formato</Label>
                <Select value={settings.format} onValueChange={(v) => setSettings({ ...settings, format: v })}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp4">MP4</SelectItem>
                    <SelectItem value="webm">WebM</SelectItem>
                    <SelectItem value="mov">MOV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>FPS</Label>
                <Select value={settings.fps} onValueChange={(v) => setSettings({ ...settings, fps: v })}>
                  <SelectTrigger className="bg-background/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 FPS</SelectItem>
                    <SelectItem value="30">30 FPS</SelectItem>
                    <SelectItem value="60">60 FPS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Settings */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <Card className="glass border-border/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { key: 'email' as const, label: 'Notificaciones por email', description: 'Recibe actualizaciones en tu correo' },
              { key: 'scheduled' as const, label: 'Recordatorio de publicaciones', description: 'Aviso antes de cada publicación programada' },
              { key: 'published' as const, label: 'Confirmación de publicación', description: 'Notificar cuando un video se publique' },
              { key: 'trends' as const, label: 'Alertas de tendencias', description: 'Recibe alertas sobre tendencias en tu nicho' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <Switch
                  checked={settings.notifications[item.key]}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, [item.key]: checked },
                    })
                  }
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-lg shadow-purple-500/20 w-full sm:w-auto"
        >
          {saved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          {saved ? 'Guardado' : 'Guardar Cambios'}
        </Button>
      </motion.div>
    </div>
  )
}
