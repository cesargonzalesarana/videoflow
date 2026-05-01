'use client'

import React from 'react'
import { TimelineEditor } from '@/components/timeline/editor/TimelineEditor'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw, Copy } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  componentStack: string | null
}

export class EditorErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null, componentStack: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, componentStack: null }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor error:', error, errorInfo)
    this.setState({ componentStack: errorInfo.componentStack })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, componentStack: null })
  }

  handleCopy = () => {
    const text = `Error: ${this.state.error?.message}\n\nStack:\n${this.state.error?.stack}\n\nComponents:\n${this.state.componentStack}`
    navigator.clipboard.writeText(text).catch(() => {})
    alert('Copiado al portapapeles')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-[#080818]">
          <div className="text-center p-8 max-w-lg w-full">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Error en el Editor</h2>
            <p className="text-sm text-white/50 mb-2">Ocurrio un error inesperado.</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-3 mb-4 text-left">
              <p className="text-xs text-red-400 font-mono break-all mb-2">{this.state.error?.message}</p>
              {this.state.componentStack && (
                <div className="border-t border-white/10 pt-2 mt-2">
                  <p className="text-[10px] text-white/30 font-mono whitespace-pre-wrap break-all">
                    {this.state.componentStack}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={this.handleRetry}
                className="bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reintentar
              </Button>
              <Button
                variant="outline"
                onClick={this.handleCopy}
                className="border-white/20 text-white/70 hover:bg-white/5"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Error
              </Button>
            </div>
            <p className="text-[10px] text-white/20 mt-3">
              Haz click en &quot;Copiar Error&quot; y pegalo aqui para que lo analice
            </p>
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