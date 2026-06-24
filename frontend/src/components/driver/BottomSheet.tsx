import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
  className?: string;
  showHandle?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  className,
  showHandle = true
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Immersive Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 dark:bg-black/80 z-[2000] backdrop-blur-md"
          />
          
          {/* Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 25, 
              stiffness: 220,
              mass: 0.8
            }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              // Dismiss if dragged down more than 100px or with enough velocity
              if (info.offset.y > 100 || info.velocity.y > 500) {
                if (onClose) onClose();
              }
            }}
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[2001] bg-white dark:bg-[#0A0A0B] border-t border-slate-200 dark:border-white/10 rounded-t-[40px] shadow-[0_-20px_60px_rgba(0,0,0,0.1)] text-slate-900 dark:text-white max-w-2xl mx-auto overflow-hidden flex flex-col",
              className
            )}
          >
            {/* Grab Handle */}
            {showHandle && (
              <div className="pt-4 pb-2 shrink-0">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full mx-auto" />
              </div>
            )}
            
            {/* Content Area */}
            <div className="flex-1 overflow-y-auto hide-scrollbar p-8 pt-4 pb-safe">
              <div className="max-h-[85vh]">
                {children}
              </div>
            </div>

            {/* Bottom Glow (Premium Touch) */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

