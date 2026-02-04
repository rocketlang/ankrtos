import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode; fallback?: ReactNode; level?: 'page' | 'section' | 'widget' }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary:${this.props.level ?? 'page'}]`, error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    const level = this.props.level ?? 'page';

    if (level === 'widget') {
      return (
        <div className="bg-red-900/20 border border-red-800/50 rounded p-3 text-xs text-red-300">
          Widget error: {this.state.error?.message ?? 'Unknown'}
        </div>
      );
    }

    if (level === 'section') {
      return (
        <div className="bg-maritime-800 rounded-lg border border-red-800/50 p-6 text-center">
          <p className="text-red-400 font-medium">Section Error</p>
          <p className="text-maritime-400 text-sm mt-2">{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-maritime-700 text-white text-sm rounded hover:bg-maritime-600">
            Retry
          </button>
        </div>
      );
    }

    // page level
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="bg-maritime-800 rounded-lg border border-red-800/50 p-8 max-w-md text-center">
          <p className="text-red-400 text-lg font-bold">Something went wrong</p>
          <p className="text-maritime-400 text-sm mt-3">{this.state.error?.message}</p>
          <div className="flex gap-3 justify-center mt-6">
            <button onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-maritime-700 text-white text-sm rounded hover:bg-maritime-600">
              Try Again
            </button>
            <button onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500">
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// Convenience wrappers
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="page">{children}</ErrorBoundary>;
}

export function SectionErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="section">{children}</ErrorBoundary>;
}

export function WidgetErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary level="widget">{children}</ErrorBoundary>;
}
