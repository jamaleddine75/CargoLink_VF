import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface QuickActionBtnProps {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  onClick: () => void;
  delay: number;
}

export const QuickActionBtn = ({ icon: Icon, label, subtitle, onClick, delay }: QuickActionBtnProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    onClick={onClick}
    className="bg-accent/10 backdrop-blur-3xl border border-border/40 p-6 rounded-[32px] hover:bg-blue-600 transition-all group cursor-pointer shadow-xl relative overflow-hidden"
  >
    <div className="relative z-10">
      <div className="w-12 h-12 rounded-2xl bg-accent/30 group-hover:bg-accent/30 flex items-center justify-center border border-border/40 group-hover:border-border/60 mb-4 transition-colors">
        <Icon className="w-6 h-6 text-blue-400 group-hover:text-foreground transition-colors" />
      </div>
      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">{label}</h4>
      <p className="text-[9px] font-bold text-muted-foreground/40 group-hover:text-foreground/60 uppercase tracking-widest mt-1">{subtitle}</p>
    </div>
    <ChevronRight className="absolute bottom-6 right-6 w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 group-hover:translate-x-1 transition-all" />
  </motion.div>
);
