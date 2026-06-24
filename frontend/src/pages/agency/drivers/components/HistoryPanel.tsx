import React, { useEffect, useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { format } from 'date-fns';
import { History, User, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import driverService from '@/services/api/driverService';
import { DriverDisciplinaryHistory } from '@/types';
import { Badge } from '@/components/ui/badge';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  driverId: string | null;
  driverName: string | null;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  driverId,
  driverName,
}) => {
  const [history, setHistory] = useState<DriverDisciplinaryHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && driverId) {
      fetchHistory();
    }
  }, [isOpen, driverId]);

  const fetchHistory = async () => {
    if (!driverId) return;
    try {
      setLoading(true);
      const data = await driverService.getDriverDisciplinaryHistory(driverId);
      setHistory(data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl bg-background border-border/40 p-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 blur-[100px] opacity-5 bg-blue-500 pointer-events-none" />
        
        <div className="p-8 h-full flex flex-col">
          <SheetHeader className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                <History className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Audit Log</p>
            </div>
            <SheetTitle className="text-3xl font-black uppercase tracking-tighter text-foreground">
              Driver <span className="text-blue-500">History</span>
            </SheetTitle>
            <SheetDescription className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
              Monitoring disciplinary actions for {driverName}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 rounded-3xl bg-accent/10 border border-border/40 animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-20">
                <AlertCircle className="w-12 h-12 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No history recorded yet</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-border/40">
                {history.map((item, idx) => (
                  <div key={item.id} className="relative pl-12">
                    <div className="absolute left-0 top-1.5 w-10 h-10 rounded-full bg-background border border-border/40 flex items-center justify-center z-10 shadow-2xl">
                       <div className={`w-2 h-2 rounded-full ${
                         item.action === 'SUSPEND' ? 'bg-amber-500' : 
                         item.action === 'BLACKLIST' ? 'bg-rose-500' : 'bg-emerald-500'
                       }`} />
                    </div>
                    
                    <div className="bg-accent/10 border border-border/40 rounded-3xl p-6 hover:bg-accent/20 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <Badge className={`rounded-lg px-2 py-0.5 border-none text-[8px] font-black uppercase tracking-widest mb-2 ${
                             item.action === 'SUSPEND' ? 'bg-amber-500/10 text-amber-400' : 
                             item.action === 'BLACKLIST' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {item.action}
                          </Badge>
                          <div className="flex items-center gap-3 text-muted-foreground/60">
                             <div className="flex items-center gap-1.5">
                               <Calendar className="w-3 h-3" />
                               <span className="text-[9px] font-bold uppercase tracking-tight">
                                 {format(new Date(item.createdAt), 'MMM dd, yyyy • HH:mm')}
                               </span>
                             </div>
                             <div className="w-1 h-1 rounded-full bg-accent/40" />
                             <div className="flex items-center gap-1.5">
                               <User className="w-3 h-3" />
                               <span className="text-[9px] font-bold uppercase tracking-tight">
                                 {item.performedBy}
                               </span>
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-4 mb-4">
                         <div className="flex-1 bg-accent/10 p-3 rounded-2xl border border-border/40">
                            <p className="text-[7px] font-black uppercase text-muted-foreground/40 mb-1">Previous Status</p>
                            <p className="text-[10px] font-black text-muted-foreground/80">{item.previousStatus}</p>
                         </div>
                         <div className="flex-1 bg-accent/10 p-3 rounded-2xl border border-border/40">
                            <p className="text-[7px] font-black uppercase text-muted-foreground/40 mb-1">New Status</p>
                            <p className="text-[10px] font-black text-foreground">{item.newStatus}</p>
                         </div>
                      </div>

                      <div className="bg-accent/10 p-4 rounded-2xl border border-border/40 flex gap-3">
                         <MessageSquare className="w-4 h-4 text-primary/60 shrink-0 mt-0.5" />
                         <p className="text-[11px] font-medium text-foreground/80 leading-relaxed italic">
                           "{item.reason}"
                         </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HistoryPanel;
