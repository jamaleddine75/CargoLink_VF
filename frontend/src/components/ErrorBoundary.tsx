import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
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
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full p-8 text-center bg-destructive/10 rounded-lg border border-destructive/20 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight mb-2 text-foreground">
            Something went wrong
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md">
            {this.props.fallbackMessage || this.state.error?.message || "An unexpected error occurred while rendering this component."}
          </p>
          <div className="flex gap-4">
            <Button onClick={this.handleReset} variant="default" className="gap-2">
              <RefreshCcw className="w-4 h-4" />
              Try again
            </Button>
            <Button onClick={() => window.location.href = '/'} variant="outline">
              Return Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
