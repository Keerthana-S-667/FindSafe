import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  isSection?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleReturnHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.isSection) {
        return (
          <div className="p-4 bg-surface-900 border border-red-500/30 rounded-xl space-y-3 text-xs">
            <div className="flex items-center gap-2 text-red-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{this.props.fallbackTitle || 'Section Unavailable'}</span>
            </div>
            <p className="text-surface-300 text-[11px]">
              {this.props.fallbackMessage || 'This section encountered an unexpected error. Other platform features remain functional.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-3 py-1 bg-surface-800 hover:bg-surface-700 text-surface-200 border border-surface-700 rounded-md text-[11px] font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" /> Retry Section
            </button>
          </div>
        );
      }

      return (
        <div className="min-h-screen bg-surface-950 text-surface-50 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface-900 border border-surface-800 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-12 h-12 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-50 mb-1">Application Error Encountered</h2>
              <p className="text-xs text-surface-400 leading-relaxed">
                The application encountered an unexpected state. Your operations have been logged safely and no database data was corrupted.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-surface-800 hover:bg-surface-700 text-surface-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-surface-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry Page</span>
              </button>
              <button
                onClick={this.handleReturnHome}
                className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-surface-950 text-xs font-extrabold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Command Center</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
