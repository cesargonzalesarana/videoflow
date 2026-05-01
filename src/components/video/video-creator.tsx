'use client'

import React from 'react'
import { TimelineEditor } from '@/components/timeline/editor/TimelineEditor'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-[#080818]">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Error en el Editor</h2>
            <p className="text-sm text-white/50 mb-1">Ocurrio un error inesperado al cargar el editor de video.</p>
            <p className="text-xs text-white/30 mb-6 font-mono break-all">{this.state.error?.message}</p>
            <Button
              onClick={this.handleRetry}
              className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function VideoCreator() {
  return (
    <EditorErrorBoundary>
      <TimelineEditor />
    </EditorErrorBoundary>
  )
}