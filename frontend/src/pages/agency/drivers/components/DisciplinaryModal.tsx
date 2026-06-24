import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, ShieldAlert, Ban, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import driverService from '@/services/api/driverService';

interface DisciplinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  driver: { id: string; name: string } | null;
  actionType: 'SUSPEND' | 'REACTIVATE' | 'BLACKLIST' | null;
  onSuccess: () => void;
}

const DisciplinaryModal: React.FC<DisciplinaryModalProps> = ({
  isOpen,
  onClose,
  driver,
  actionType,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    if (!driver || !actionType) return;
    if (!reason.trim()) {
      toast.error('Reason is required');
      return;
    }

    try {
      setLoading(true);
      if (actionType === 'SUSPEND') {
        await driverService.suspendDriver(driver.id, reason);
        toast.success(`${driver.name} has been suspended.`);
      } else if (actionType === 'REACTIVATE') {
        await driverService.reactivateDriver(driver.id, reason);
        toast.success(`${driver.name} has been reactivated.`);
      } else if (actionType === 'BLACKLIST') {
        await driverService.blacklistDriver(driver.id, reason);
        toast.success(`${driver.name} has been blacklisted locally.`);
      }
      onSuccess();
      onClose();
      setReason('');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Action failed. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const config = {
    SUSPEND: {
      title: 'Suspend Driver',
      description: `This will temporarily prevent ${driver?.name} from accepting new missions.`,
      icon: ShieldAlert,
      color: 'amber',
      buttonLabel: 'Confirm Suspension',
    },
    REACTIVATE: {
      title: 'Reactivate Driver',
      description: `Restore full access for ${driver?.name}.`,
      icon: RefreshCw,
      color: 'emerald',
      buttonLabel: 'Reactivate Now',
    },
    BLACKLIST: {
      title: 'Blacklist Driver',
      description: `Permanently remove ${driver?.name} from your agency's fleet. This action is serious.`,
      icon: Ban,
      color: 'rose',
      buttonLabel: 'Blacklist Driver',
    },
  };

  const current = actionType ? config[actionType] : null;
  if (!current) return null;

  const Icon = current.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-background border-border/40 rounded-[2.5rem] max-w-md overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] opacity-10 bg-${current.color}-500`} />
        
        <DialogHeader>
          <div className={`w-14 h-14 rounded-2xl bg-${current.color}-500/10 flex items-center justify-center mb-4 border border-${current.color}-500/20`}>
            <Icon className={`w-7 h-7 text-${current.color}-400`} />
          </div>
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-foreground">
            {current.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-medium">
            {current.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
              Reason for Action <span className="text-rose-500">*</span>
            </label>
            <Textarea
              placeholder="Provide a clear justification (e.g., missed deliveries, unprofessional behavior)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-accent/10 border-border/40 rounded-2xl min-h-[120px] focus:ring-primary/20 text-foreground placeholder:text-muted-foreground/20"
            />
          </div>
          
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-accent/10 border border-border/40">
            <AlertCircle className="w-4 h-4 text-primary/60 mt-0.5" />
            <p className="text-[10px] text-muted-foreground/60 leading-relaxed uppercase tracking-tight font-bold">
              This action will be logged in the driver's history and visible to other agency administrators.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            className="rounded-2xl h-14 font-black uppercase tracking-widest text-[10px] text-muted-foreground hover:text-foreground hover:bg-accent/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={loading || !reason.trim()}
            className={`rounded-2xl h-14 px-8 font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 bg-${current.color === 'amber' ? 'amber-600' : current.color === 'emerald' ? 'emerald-600' : 'rose-600'} hover:bg-${current.color === 'amber' ? 'amber-500' : current.color === 'emerald' ? 'emerald-500' : 'rose-500'} text-primary-foreground shadow-${current.color}-600/20`}
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            {current.buttonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DisciplinaryModal;
