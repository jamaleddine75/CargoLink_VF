import React, { useEffect, useState } from 'react';
import { 
  Activity, Search, Filter, ShieldAlert, UserCheck, 
  Building2, AlertTriangle, Download, Calendar,
  Clock, ArrowUpRight, MousePointer2, User,
  Key, Database, Briefcase, Zap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
   const [logs, setLogs] = useState<any[]>([]);

   const fetchLogs = async () => {
      try {
         const data = await adminService.getAuditLogs({ page: 0, size: 100 });
         const items = data?.content || [];
         setLogs(
            items.map((log: any) => ({
               id: log.id,
               action: log.action || 'Operation',
               actor: log.actor || 'System',
               target: log.target || log.entity || 'N/A',
               category: log.category || 'ALL',
               timestamp: log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
               details: log.details || log.ipAddress || 'No details',
               severity: log.severity || 'INFO',
            }))
         );
      } catch (error) {
         toast.error('Échec de chargement des logs');
      }
   };

   useEffect(() => {
      fetchLogs();
   }, []);

   const filteredLogs = logs.filter((log) => {
      const matchesCategory = activeFilter === 'ALL' || log.category === activeFilter;
      const value = `${log.action} ${log.actor} ${log.target} ${log.details}`.toLowerCase();
      const matchesSearch = value.includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
   });

   const handleExportLedger = () => {
      if (!filteredLogs.length) {
         toast.info('No logs to export');
         return;
      }

      const csvEscape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
      const headers = ['id', 'action', 'actor', 'target', 'category', 'severity', 'timestamp', 'details'];
      const rows = filteredLogs.map((log) =>
         [
            log.id,
            log.action,
            log.actor,
            log.target,
            log.category,
            log.severity,
            log.timestamp,
            log.details,
         ]
            .map(csvEscape)
            .join(',')
      );

      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Audit ledger exported');
   };

   const handleExpandDetails = async (log: any) => {
      const payload = JSON.stringify(log, null, 2);

      try {
         await navigator.clipboard.writeText(payload);
         toast.success('Log details copied to clipboard');
      } catch (error) {
         toast.info(log.details || 'No extra details available');
      }
   };

  const categories = [
    { id: 'ALL', label: 'All Operations', icon: Activity },
    { id: 'SECURITY', label: 'Security', icon: ShieldAlert },
    { id: 'AGENCY', label: 'Agency', icon: Building2 },
    { id: 'ADMIN', label: 'Admin', icon: UserCheck },
    { id: 'FINANCE', label: 'Finance', icon: Zap },
  ];

  return (
    <div className="space-y-10 pb-20 font-sans selection:bg-primary/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                 System Traceability
              </Badge>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           </div>
           <h1 className="text-4xl font-black tracking-tight text-foreground uppercase leading-none">
              Timeline <span className="text-indigo-500">Helix</span>
           </h1>
           <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">
              Deep-layer audit of <span className="text-indigo-400">Global Operations</span> and Access Protocols
           </p>
        </div>
        
        <div className="flex items-center gap-3">
           <Button onClick={handleExportLedger} className="h-14 px-8 rounded-2xl bg-accent/30 hover:bg-white/10 text-foreground border border-border/40 font-black uppercase text-[10px] tracking-widest">
              <Download className="w-4 h-4 mr-2" /> Export Ledger
           </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
         {/* Filter Sidebar */}
         <div className="lg:col-span-1 space-y-8">
            <div className="relative group">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                      <Input
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         placeholder="Trace Actor/ID..."
                         className="h-16 bg-accent/30 border-border/40 rounded-[24px] pl-14 pr-6 font-bold text-xs text-foreground focus:border-indigo-500/50"
                      />
            </div>

            <div className="space-y-2">
               {categories.map((cat) => (
                 <button
                   key={cat.id}
                   onClick={() => setActiveFilter(cat.id)}
                   className={cn(
                     "w-full flex items-center justify-between px-6 py-5 rounded-[24px] transition-all group",
                     activeFilter === cat.id 
                       ? "bg-indigo-600 text-foreground shadow-2xl" 
                       : "text-foreground/40 hover:text-foreground hover:bg-accent/30"
                   )}
                 >
                    <div className="flex items-center gap-4">
                       <cat.icon className={cn(
                         "w-5 h-5 transition-transform group-hover:scale-110",
                         activeFilter === cat.id ? "text-foreground" : "text-indigo-500"
                       )} />
                       <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 transition-all",
                      activeFilter === cat.id ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1"
                    )} />
                 </button>
               ))}
            </div>
         </div>

         {/* Timeline Column */}
         <div className="lg:col-span-3 space-y-8">
            <div className="relative pl-12 border-l border-border/40 space-y-10">
               {filteredLogs.map((log, idx) => (
                 <motion.div
                   key={log.id}
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   transition={{ delay: idx * 0.1 }}
                   className="relative"
                 >
                    {/* Node Dot */}
                    <div className={cn(
                      "absolute -left-[60px] top-4 w-4 h-4 rounded-full border-4 border-[#020617] z-10",
                      log.severity === 'CRITICAL' ? "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" : 
                      log.severity === 'WARNING' ? "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : 
                      "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    )} />
                    
                    {/* Timeline Card */}
                    <Card className="premium-glass p-8 border-none relative overflow-hidden group hover:scale-[1.02] transition-transform">
                       <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="space-y-4">
                             <div className="flex items-center gap-4">
                                <Badge variant="outline" className="rounded-lg border-border/40 bg-accent/30 text-[9px] font-black uppercase tracking-widest text-indigo-400 px-2 py-1">
                                   {log.category}
                                </Badge>
                                <span className="text-[10px] font-bold text-foreground/20 uppercase tracking-widest flex items-center gap-2">
                                   <Clock className="w-3.5 h-3.5" /> {log.timestamp}
                                </span>
                             </div>
                             
                             <div>
                                <h3 className="text-lg font-black text-foreground uppercase tracking-tight group-hover:text-indigo-400 transition-colors leading-none mb-2">{log.action}</h3>
                                <p className="text-[11px] text-foreground/40 font-bold uppercase tracking-widest leading-relaxed">
                                   Actor: <span className="text-foreground/60">{log.actor}</span> <span className="mx-2 opacity-20">|</span> 
                                   Target: <span className="text-foreground/60">{log.target}</span>
                                </p>
                             </div>
                          </div>

                          <div className="flex items-center gap-6">
                             <div className="hidden md:block w-px h-12 bg-accent/30" />
                             <div className="flex flex-col items-end gap-3">
                                <div className={cn(
                                  "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-border/40",
                                  log.severity === 'CRITICAL' ? "bg-rose-500/10 text-rose-500" : 
                                  log.severity === 'WARNING' ? "bg-amber-500/10 text-amber-500" : 
                                  "bg-emerald-500/10 text-emerald-500"
                                )}>
                                   {log.severity}
                                </div>
                                <Button onClick={() => handleExpandDetails(log)} variant="link" className="h-auto p-0 text-[10px] font-black text-foreground/20 hover:text-foreground uppercase tracking-widest">
                                   Expand Details <ArrowUpRight className="w-3 h-3 ml-1" />
                                </Button>
                             </div>
                          </div>
                       </div>

                       {/* Hover Detail Preview */}
                       <div className="mt-6 pt-6 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest italic flex items-center gap-2">
                             <Database className="w-3.5 h-3.5" /> {log.details}
                          </p>
                       </div>

                       {/* Background Glow */}
                       <div className={cn(
                         "absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] opacity-10 rounded-full",
                         log.severity === 'CRITICAL' ? "bg-rose-600" : "bg-indigo-600"
                       )} />
                    </Card>
                 </motion.div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default AuditLogs;
