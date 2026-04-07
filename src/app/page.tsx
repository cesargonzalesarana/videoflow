'use client'

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

const viewComponents: Record<string, React.ComponentType> = {
  dashboard: Dashboard,
  'video-creator': VideoCreator,
  'ai-trends': ScriptGenerator,
  settings: SettingsPanel,
}

export default function Home() {
  const { currentView, isAuthenticated } = useAppStore()

  // Show auth/landing when not logged in
  if (!isAuthenticated) {
    return <AuthForm />
  }

  // Show app layout when logged in
  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/50 glass-strong">
        <Sidebar />
      </aside>

      {/* Main Content */}
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

              {currentView === 'video-creator' && <VideoCreator />}

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
