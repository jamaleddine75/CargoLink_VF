import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Navigation, MapPin, AlertCircle, Check } from 'lucide-react';

interface DeliveryStep {
  number: 1 | 2 | 3 | 4 | 5;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface DeliveryStepBarProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
}

const steps: DeliveryStep[] = [
  { number: 1, title: 'Confirmed', description: 'Ready', icon: <CheckCircle2 /> },
  { number: 2, title: 'Pickup', description: 'Heading there', icon: <Navigation /> },
  { number: 3, title: 'Delivery', description: 'On the way', icon: <MapPin /> },
  { number: 4, title: 'Arrived', description: 'At door', icon: <AlertCircle /> },
  { number: 5, title: 'Delivered', description: 'Done', icon: <CheckCircle2 /> }
];

const DeliveryStepBar: React.FC<DeliveryStepBarProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="relative flex justify-between items-center w-full px-2 mt-4 mb-2">
      {/* Background connector line */}
      <div className="absolute left-[10%] right-[10%] top-5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full z-0" />
      
      {/* Active connector line */}
      <motion.div 
        className="absolute left-[10%] top-5 h-1.5 bg-green-500 rounded-full z-0"
        initial={{ width: '0%' }}
        animate={{ width: `${Math.max(0, (currentStep - 1) / (steps.length - 1)) * 80}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />

      {steps.map((s) => {
        const isPast = s.number < currentStep;
        const isCurrent = s.number === currentStep;
        const isFuture = s.number > currentStep;

        return (
          <div key={s.number} className="relative z-10 flex flex-col items-center">
            <motion.button
              whileHover={isPast ? { scale: 1.1 } : {}}
              whileTap={isPast ? { scale: 0.95 } : {}}
              onClick={() => isPast && onStepClick?.(s.number)}
              disabled={isFuture || isCurrent}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white dark:border-[#0A0A0A] shadow-md transition-colors ${
                isCurrent
                  ? 'bg-primary text-white shadow-primary/30 ring-4 ring-primary/20'
                  : isPast
                  ? 'bg-green-500 text-white cursor-pointer hover:bg-green-600'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
              }`}
            >
              {isPast ? <Check className="w-4 h-4" /> : React.cloneElement(s.icon as React.ReactElement, { className: "w-4 h-4" })}
            </motion.button>
            
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: s.number * 0.1 }}
              className="mt-3 text-center"
            >
              <p className={`text-[9px] font-black uppercase tracking-widest ${
                isCurrent ? 'text-primary' : isPast ? 'text-green-500 dark:text-green-400' : 'text-slate-400'
              }`}>
                {s.title}
              </p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default DeliveryStepBar;
