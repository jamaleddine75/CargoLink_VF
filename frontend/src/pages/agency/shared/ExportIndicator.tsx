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
        <div className="bg-card border border-border rounded-lg p-5 shadow-lg overflow-hidden relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
                status === 'LOADING' ? 'bg-primary/10 text-primary border-primary/20' :
                status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {status === 'LOADING' ? <RefreshCw className="w-5 h-5 animate-spin" /> :
                 status === 'SUCCESS' ? <CheckCircle2 className="w-5 h-5" /> :
                 <Download className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">
                  {status === 'LOADING' ? 'Compilation des données' :
                   status === 'SUCCESS' ? 'Exportation réussie' : 'Erreur Système'}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {filename || 'Fichier opérationnel'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {status === 'LOADING' && (
            <div className="space-y-2">
              <Progress value={progress} className="h-1.5 bg-muted" />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Synchronisation...</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}

          {status === 'SUCCESS' && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[10px] text-emerald-600 dark:text-emerald-400"
            >
              Le fichier a été téléchargé avec succès sur votre appareil.
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
export default ExportIndicator;
