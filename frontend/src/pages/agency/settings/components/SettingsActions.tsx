import React from 'react';
import { Save, Loader2, RotateCcw } from 'lucide-react';

interface SettingsActionsProps {
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
  hasChanges: boolean;
}

const SettingsActions: React.FC<SettingsActionsProps> = ({ onSave, onReset, isSaving, hasChanges }) => {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-end gap-4 mt-8 pt-6 border-t border-border/40">
      <button
        onClick={onReset}
        disabled={isSaving || !hasChanges}
        className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <RotateCcw className="w-4 h-4" /> Reset Changes
      </button>
      
      <button
        onClick={onSave}
        disabled={isSaving || !hasChanges}
        className={`
          w-full sm:w-auto px-8 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg
          ${isSaving || !hasChanges
            ? 'bg-accent/30 text-muted-foreground cursor-not-allowed'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/20 active:scale-95'}
        `}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" /> Save Profile
          </>
        )}
      </button>
    </div>
  );
};

export default SettingsActions;
