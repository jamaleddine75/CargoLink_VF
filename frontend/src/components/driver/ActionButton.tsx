import React, { ButtonHTMLAttributes } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'ghost' | 'danger';
}

export const ActionButton: React.FC<ActionButtonProps> = ({ 
  loading, 
  children, 
  variant = 'primary',
  className = '',
  disabled,
  ...props 
}) => {
  const { isReplaying } = useOfflineQueue();
  const baseStyles = "w-full h-16 font-black text-sm uppercase tracking-widest rounded-2xl active:scale-95 transition-all flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-green-500 text-black shadow-xl shadow-green-500/20",
    ghost: "bg-transparent text-slate-600 dark:text-white/60 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 shadow-xl shadow-red-500/10 hover:bg-red-500/20"
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading || isReplaying}
      aria-busy={loading || isReplaying}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading...</span>
        </>
      ) : isReplaying ? (
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Syncing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};
