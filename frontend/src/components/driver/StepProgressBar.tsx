import React from 'react';

interface StepProgressBarProps {
  currentStep: 1 | 2 | 3 | 4;
}

export const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep }) => {
  const steps = [1, 2, 3, 4];
  const progress = ((currentStep - 1) / 3) * 100;

  return (
    <div className="w-full relative py-2">
      {/* Background track */}
      <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-200 dark:bg-white/10 -translate-y-1/2 rounded-full" />
      
      {/* Active progress track */}
      <div 
        className="absolute top-1/2 left-0 h-1.5 bg-green-500 -translate-y-1/2 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
      
      {/* Step nodes */}
      <div className="relative flex justify-between items-center w-full z-10">
        {steps.map((step) => {
          const isCompleted = step < currentStep;
          const isActive = step === currentStep;
          
          return (
            <div 
              key={step}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-300
                ${isCompleted ? 'bg-green-500 border-green-500' : 
                  isActive ? 'bg-white dark:bg-black border-green-500 shadow-[0_0_12px_rgba(34,197,94,0.5)] scale-125' : 
                  'bg-white dark:bg-black border-slate-300 dark:border-white/20'}`}
            />
          );
        })}
      </div>
    </div>
  );
};
