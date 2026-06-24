import React from 'react';
import { motion } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface AvailabilityToggleProps {
  isAvailable: boolean;
  onChange: (checked: boolean) => void;
  loading?: boolean;
}

const AvailabilityToggle: React.FC<AvailabilityToggleProps> = ({ isAvailable, onChange, loading = false }) => {
  return (
    <motion.div 
      initial={false}
      animate={{
        borderColor: isAvailable ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.05)',
        boxShadow: isAvailable ? '0 0 15px rgba(34, 197, 94, 0.3), inset 0 0 10px rgba(34, 197, 94, 0.1)' : 'none',
      }}
      transition={{ duration: 0.3 }}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 bg-slate-900/80 backdrop-blur-md transition-opacity ${loading ? 'opacity-70 pointer-events-none' : ''}`}
    >
      {loading ? (
        <Loader2 className={`w-4 h-4 animate-spin ${isAvailable ? 'text-green-500' : 'text-slate-400'}`} />
      ) : (
        <div className="relative flex items-center justify-center">
          {isAvailable && (
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute w-3 h-3 bg-green-500 rounded-full"
            />
          )}
          <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'bg-slate-600'}`} />
        </div>
      )}
      
      <span className={`text-[10px] font-black uppercase tracking-[0.2em] flex-1 ${isAvailable ? 'text-green-500' : 'text-slate-500'}`}>
        {isAvailable ? 'Live' : 'Offline'}
      </span>
      
      <Switch
        checked={isAvailable}
        onCheckedChange={onChange}
        disabled={loading}
        className="data-[state=checked]:bg-green-500 data-[state=checked]:shadow-[0_0_10px_rgba(34,197,94,0.5)]"
      />
    </motion.div>
  );
};

export default AvailabilityToggle;
