import React from 'react';
import { motion } from 'framer-motion';
import { Check, MapPin, Package, Settings2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  currentStep: number;
  steps: {
    id: string;
    title: string;
    icon: React.ReactNode;
  }[];
}

const StepProgress: React.FC<StepProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-12">
      <div className="relative flex justify-between">
        {/* Connection Lines */}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border/40 -translate-y-1/2 z-0" />
        <motion.div 
          className="absolute top-1/2 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-500 -translate-y-1/2 z-0"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />

        {/* Steps */}
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted || isActive ? 'rgb(37 99 235)' : 'rgb(15 23 42)',
                }}
                className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-colors duration-300 shadow-xl",
                  isCompleted || isActive ? "border-blue-400 shadow-blue-500/20" : "border-border/40 text-muted-foreground",
                  isActive && "ring-4 ring-blue-500/20"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-white" />
                ) : (
                  <div className={cn(
                    "transition-colors",
                    isActive ? "text-white" : "text-muted-foreground"
                  )}>
                    {step.icon}
                  </div>
                )}
              </motion.div>
              
              <div className="absolute top-14 text-center whitespace-nowrap">
                <span className={cn(
                  "text-xs font-black uppercase tracking-widest transition-colors duration-300",
                  isActive ? "text-blue-500" : isCompleted ? "text-blue-400/80" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepProgress;
