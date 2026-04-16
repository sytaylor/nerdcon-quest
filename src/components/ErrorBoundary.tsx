import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  /** 'global' shows full-screen recovery, 'screen' shows inline recovery with nav */
  level?: 'global' | 'screen'
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const level = this.props.level ?? 'global'

    if (level === 'global') {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-void-black px-6 text-center">
          <div className="rounded-xl border border-boss-magenta/30 bg-boss-magenta/10 p-8">
            <AlertTriangle className="mx-auto mb-4 text-boss-magenta" size={40} />
            <h1 className="font-mono text-lg font-bold text-terminal-white">
              Something went wrong
            </h1>
            <p className="mt-2 font-sans text-sm text-fog-gray">
              The app hit an unexpected error. Tap below to reload.
            </p>
            {this.state.error && (
              <p className="mt-3 font-mono text-xs text-fog-gray/60 break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-nerdcon-blue/50 bg-nerdcon-blue/10 px-6 py-3 font-mono text-sm text-nerdcon-blue transition-colors hover:bg-nerdcon-blue/20"
            >
              <RefreshCw size={16} />
              Reload App
            </button>
          </div>
        </div>
      )
    }

    // Screen-level: inline recovery, user can navigate away via TabBar
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
        <div className="rounded-xl border border-boss-magenta/30 bg-boss-magenta/10 p-6">
          <AlertTriangle className="mx-auto mb-3 text-boss-magenta" size={32} />
          <h2 className="font-mono text-base font-bold text-terminal-white">
            This screen crashed
          </h2>
          <p className="mt-2 font-sans text-sm text-fog-gray">
            Try again or switch to another tab.
          </p>
          <button
            onClick={this.handleReset}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-nerdcon-blue/50 bg-nerdcon-blue/10 px-5 py-2.5 font-mono text-sm text-nerdcon-blue transition-colors hover:bg-nerdcon-blue/20"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      </div>
    )
  }
}
