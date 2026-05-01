'use client'

import React from 'react'
import { TimelineEditor } from '@/components/timeline/editor/TimelineEditor'

// === SECTION ERROR BOUNDARY ===
// Catches errors in individual editor sections so one crash doesn't kill the whole editor
interface SectionErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; name: string; fallback?: React.ReactNode },
  SectionErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; name: string; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): SectionErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[VideoFlow] Section "${this.props.name}" crashed:`, error.message)
    console.error(`[VideoFlow] Section stack:`, info.componentStack?.substring(0, 300))
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <div className="flex items-center justify-center bg-red-500/5 border border-red-500/10 text-xs text-red-400/60 p-4">
          Error en {this.props.name}: {this.state.error?.message}
        </div>
      )
    }
    return this.props.children
  }
}

// === MAIN EDITOR ERROR BOUNDARY ===
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  componentStack: string
}

export class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, componentStack: '' }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('=== EDITOR CRASH DEBUG ===')
    console.error('Error:', error.message)
    console.error('Stack trace:', error.stack)
    console.error('Component stack:', errorInfo.componentStack)
    this.setState({ componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-[#080818]">
          <div className="text-center max-w-lg px-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-white/90 mb-2">Error en el Editor</h2>
            <p className="text-sm text-white/50 mb-4">
              Ocurrio un error inesperado.
            </p>
            {this.state.error && (
              <p className="text-xs text-red-400/70 bg-red-500/5 border border-red-500/10 rounded-lg p-3 mb-4 font-mono break-all text-left">
                {this.state.error.message}
              </p>
            )}
            {this.state.componentStack && (
              <pre className="text-[10px] text-amber-400/70 bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 mb-4 font-mono whitespace-pre-wrap text-left max-h-40 overflow-auto">
                {this.state.componentStack}
              </pre>
            )}
            <p className="text-[10px] text-white/30 mb-4">
              Abre la consola (F12) para ver mas detalles del error.
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null, componentStack: '' })
                window.location.reload()
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-sm rounded-lg shadow-lg shadow-violet-500/20 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// === SAFE SECTION WRAPPER ===
function SafeSection({ name, children, fallback }: { name: string; children: React.ReactNode; fallback?: React.ReactNode }) {
  return (
    <SectionErrorBoundary name={name} fallback={fallback}>
      {children}
    </SectionErrorBoundary>
  )
}

// === MAIN VIDEO CREATOR COMPONENT ===
export function VideoCreator() {
  console.log('[VideoFlow] VideoCreator render')

  return (
    <EditorErrorBoundary>
      <div className="h-full flex flex-col bg-[#080818]" data-testid="video-creator-root">
        <SafeSection name="TimelineEditor">
          <TimelineEditor />
        </SafeSection>
      </div>
    </EditorErrorBoundary>
  )
}
