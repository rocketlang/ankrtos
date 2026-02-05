/**
 * Error Boundary Components
 * Three types: Route-level, Component-level, and Async operation
 *
 * @package @ankr/mari8x
 * @version 1.0.0
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'route' | 'component' | 'async';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Base Error Boundary Class Component
 * React error boundaries must be class components
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Log to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to Sentry/DataDog
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const level = this.props.level || 'component';
      
      if (level === 'route') {
        return <RouteErrorFallback error={this.state.error} onReset={this.resetError} />;
      } else if (level === 'component') {
        return <ComponentErrorFallback error={this.state.error} onReset={this.resetError} />;
      } else {
        return <AsyncErrorFallback error={this.state.error} onReset={this.resetError} />;
      }
    }

    return this.props.children;
  }
}

/**
 * Route-Level Error Fallback
 * Full-page error display for route failures
 */
function RouteErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="min-h-screen bg-maritime-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="bg-maritime-800 border border-maritime-700 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-maritime-400 mb-6">
            We encountered an error loading this page. Please try again or return to the dashboard.
          </p>
          
          {error && (
            <div className="bg-maritime-900 border border-maritime-700 rounded p-4 mb-6 text-left">
              <p className="text-red-400 text-sm font-mono">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={onReset}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center gap-2 bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component-Level Error Fallback
 * Inline error display for component failures
 */
function ComponentErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-red-400 font-semibold mb-1">Component Error</h3>
          <p className="text-maritime-300 text-sm mb-3">
            This component failed to render. You can continue using other parts of the page.
          </p>
          {error && (
            <p className="text-red-400 text-xs font-mono mb-3 bg-maritime-900 p-2 rounded">
              {error.message}
            </p>
          )}
          <button
            onClick={onReset}
            className="flex items-center gap-2 bg-maritime-700 hover:bg-maritime-600 text-maritime-300 px-3 py-1.5 rounded text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Async Operation Error Fallback
 * Minimal error display for async operation failures
 */
function AsyncErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <p className="text-maritime-300 text-sm">
            {error?.message || 'Operation failed'}
          </p>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-blue-400 hover:text-blue-300 font-medium"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

/**
 * Route-Level Error Boundary
 * Use this to wrap entire routes
 */
export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryClass level="route">
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Component-Level Error Boundary
 * Use this to wrap individual components
 */
export function ComponentErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ErrorBoundaryClass level="component" fallback={fallback}>
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Async Operation Error Boundary
 * Use this to wrap async operations (GraphQL queries, API calls)
 */
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundaryClass level="async">
      {children}
    </ErrorBoundaryClass>
  );
}

/**
 * Hook for programmatic error boundary control
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
