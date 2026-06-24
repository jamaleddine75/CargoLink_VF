import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center driver-theme">
          <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-red-500/20 blur-xl animate-pulse" />
            <AlertTriangle className="w-12 h-12 text-red-500 relative z-10" />
          </div>
          
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Unit Failure</h1>
          <p className="text-sm font-bold text-white/40 uppercase tracking-widest max-w-xs mb-12">
            A critical system error occurred. Diagnostics logged.
          </p>

          <Button 
            onClick={() => window.location.reload()}
            className="w-full max-w-xs h-16 rounded-2xl bg-white text-black font-black uppercase tracking-widest shadow-[0_0_40px_rgba(255,255,255,0.2)]"
          >
            <RefreshCcw className="w-5 h-5 mr-3" />
            Reboot Interface
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
