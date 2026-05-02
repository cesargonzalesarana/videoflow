'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { AuthForm } from '@/components/auth/auth-form'
import { Navbar } from '@/components/layout/navbar'
import { Sidebar } from '@/components/layout/sidebar'
import { Dashboard } from '@/components/dashboard/dashboard'
import { VideoCreator } from '@/components/video/video-creator'
import { CalendarView } from '@/components/scheduler/calendar-view'
import { ScheduleList } from '@/components/scheduler/schedule-list'
import { TrendsFeed } from '@/components/ai/trends-feed'
import { ScriptGenerator } from '@/components/ai/script-generator'
import { SettingsPanel } from '@/components/settings/settings-panel'
import { AnimatePresence, motion } from 'framer-motion'

// Error boundary for each section to prevent crashes from spreading
import React from 'react'
class SectionBoundary extends React.Component<
  { children: React.ReactNode; name: string },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error } }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Page] Section "${this.props.name}" error:`, error.message)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
          Error cargando {this.props.name}
        </div>
      )
    }
    return this.props.children
  }
}

export default function Home() {
  const { currentView, isAuthenticated, login, setAuthLoading, isAuthLoading } = useAppStore()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for existing Supabase session on mount
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

  // Don't render until client-side mounted (prevents hydration issues)
  if (!mounted) {
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

  // Show loading state while checking session
  if (isAuthenticated === false && isAuthLoading) {
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

  // Show auth/landing when not logged in
  if (!isAuthenticated) {
    return <AuthForm />
  }

  // Full-screen editor - NO sidebar, NO navbar, NO API calls from other views
  if (currentView === 'video-creator') {
    return <div className="h-screen w-screen overflow-hidden"><VideoCreator /></div>
  }

  // Show app layout when logged in (only for non-editor views)
  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 glass-strong">
        <SectionBoundary name="Sidebar">
          <Sidebar />
        </SectionBoundary>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <SectionBoundary name="Navbar">
          <Navbar />
        </SectionBoundary>

        <main className="flex-1 overflow-hidden p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentView === 'dashboard' && (
                <SectionBoundary name="Dashboard">
                  <Dashboard />
                </SectionBoundary>
              )}

              {currentView === 'scheduler' && (
                <div className="space-y-6">
                  <SectionBoundary name="CalendarView">
                    <CalendarView />
                  </SectionBoundary>
                  <SectionBoundary name="ScheduleList">
                    <ScheduleList />
                  </SectionBoundary>
                </div>
              )}

              {currentView === 'ai-trends' && (
                <div className="space-y-6">
                  <SectionBoundary name="ScriptGenerator">
                    <ScriptGenerator />
                  </SectionBoundary>
                  <SectionBoundary name="TrendsFeed">
                    <TrendsFeed />
                  </SectionBoundary>
                </div>
              )}

              {currentView === 'settings' && (
                <SectionBoundary name="SettingsPanel">
                  <SettingsPanel />
                </SectionBoundary>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
