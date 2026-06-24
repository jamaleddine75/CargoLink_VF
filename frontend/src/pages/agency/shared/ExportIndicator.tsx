import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Progress } from "@/components/ui/progress";

interface ExportIndicatorProps {
  status: 'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR';
  progress: number;
  filename?: string;
  onClose: () => void;
}

export const ExportIndicator: React.FC<ExportIndicatorProps> = ({
  status,
  progress,
  filename,
  onClose
}) => {
  if (status === 'IDLE') return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="fixed bottom-10 right-10 z-[100] w-96"
      >
        <div className="bg-[#0f172a] border border-border/40 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden relative group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                status === 'LOADING' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}>
                {status === 'LOADING' ? <RefreshCw className="w-6 h-6 animate-spin" /> :
                 status === 'SUCCESS' ? <CheckCircle2 className="w-6 h-6" /> :
                 <Download className="w-6 h-6" />}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase tracking-tight text-foreground">
                  {status === 'LOADING' ? 'Compiling Dataset' :
                   status === 'SUCCESS' ? 'Export Complete' : 'System Error'}
                </h4>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest mt-1">
                  {filename || 'Operational Record'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {status === 'LOADING' && (
            <div className="space-y-3">
              <Progress value={progress} className="h-1.5 bg-accent/30" />
              <div className="flex justify-between text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                <span>Synchronizing Sector Data</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[9px] font-bold text-emerald-400/60 uppercase tracking-widest"
            >
              Dataset has been decentralized to local storage.
            </motion.p>
          )}

          {/* Background Glow */}
          <div className={`absolute -right-20 -bottom-20 w-40 h-40 blur-3xl opacity-10 rounded-full transition-colors ${
            status === 'LOADING' ? 'bg-blue-500' :
            status === 'SUCCESS' ? 'bg-emerald-500' : 'bg-rose-500'
          }`} />
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
