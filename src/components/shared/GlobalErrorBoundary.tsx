import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error details in localStorage for debugging
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      };
      const existingErrors = localStorage.getItem('clientErrors');
      const errors = existingErrors ? JSON.parse(existingErrors) : [];
      errors.push(errorLog);
      // Keep only last 10 errors
      if (errors.length > 10) errors.shift();
      localStorage.setItem('clientErrors', JSON.stringify(errors));
    } catch (e) {
      console.error('Failed to store error in localStorage:', e);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleReset = async () => {
    try {
      // Clear all caches
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        console.log('All caches cleared');
      }

      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('All service workers unregistered');
      }

      // Clear localStorage flags
      localStorage.removeItem('DISABLE_SW');
      localStorage.removeItem('clientErrors');

      // Force reload
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset:', e);
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-destructive">Se produjo un error</CardTitle>
                  <CardDescription>
                    La aplicación encontró un problema inesperado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {this.state.error && (
                <div className="p-4 bg-muted rounded-lg text-sm font-mono overflow-auto max-h-40">
                  <div className="text-destructive font-semibold mb-2">
                    {this.state.error.toString()}
                  </div>
                  {this.state.error.stack && (
                    <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
                <Button
                  onClick={this.handleReset}
                  className="flex-1"
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Resetear cachés y SW
                </Button>
              </div>

              <div className="text-xs text-muted-foreground text-center">
                Si el problema persiste, visita{' '}
                <a href="/debug" className="text-primary hover:underline">
                  /debug
                </a>{' '}
                para más herramientas de diagnóstico
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
