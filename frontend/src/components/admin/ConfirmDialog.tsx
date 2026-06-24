import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void | Promise<void>;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  requireReason?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  requireReason = false,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(requireReason ? reason : undefined);
      onClose();
      setReason("");
    } catch (error) {
      console.error("Confirmation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className={cn(
          "p-8 flex items-center gap-4 border-b",
          destructive ? "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30" : "bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800"
        )}>
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg",
            destructive ? "bg-rose-600 text-white" : "bg-indigo-600 text-white"
          )}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none">{title}</DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-8 space-y-6">
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
            {description}
          </DialogDescription>

          {requireReason && (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Reason for action</label>
              <Textarea
                placeholder="Please provide a reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-2xl border-2 border-slate-100 dark:border-slate-800 focus:border-indigo-500 transition-all min-h-[100px]"
              />
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 flex gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
            className={cn(
              "flex-1 rounded-2xl h-14 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95",
              destructive 
                ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30"
            )}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
