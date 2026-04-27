'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { AuthForm } from '@/components/auth/auth-form'
import { LandingPage } from '@/components/landing/landing-page'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { VideoCreator } from '@/components/video/video-creator'
import { CalendarView } from '@/components/scheduler/calendar-view'
import { ScheduleList } from '@/components/scheduler/schedule-list'
import { TrendsFeed } from '@/components/ai/trends-feed'
import { ScriptGenerator } from '@/components/ai/script-generator'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { ProjectList } from '@/components/projects/project-list'
import { AnimatePresence, motion } from 'framer-motion'

export default function Home() {
  const { currentView, isAuthenticated, login, setAuthLoading } = useAppStore()

  useEffect(() => {
    async function checkSession() {
      try {
        setAuthLoading(true)
        const res = await fetch('/api/auth', { method: 'GET' })
        const data = await res.json()
        if (data.authenticated && data.user) {
          login(data.user)
        }
      } catch (error) {
        console.error('Session check failed:', error)
      } finally {
        setAuthLoading(false)
      }
    }
    checkSession()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (isAuthenticated === false && useAppStore.getState().isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center animated-gradient">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">Cargando VideoFlow...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LandingPage />
  }

  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 glass-strong">
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'projects' && <ProjectList />}
              {currentView === 'video-creator' && <div className="-m-4 md:-m-6 h-[calc(100vh-64px)]"><VideoCreator /></div>}
              {currentView === 'scheduler' && (
                <div className="space-y-6">
                  <CalendarView />
                  <ScheduleList />
                </div>
              )}
              {currentView === 'ai-trends' && (
                <div className="space-y-6">
                  <ScriptGenerator />
                  <TrendsFeed />
                </div>
              )}
              {currentView === 'settings' && <SettingsPanel />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
