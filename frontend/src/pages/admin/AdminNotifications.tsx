import React, { useEffect, useMemo, useState } from 'react';
import { 
  Bell, Send, Info, AlertTriangle, 
  ShieldAlert, Users, Truck, Building2,
  Trash2, Search, Filter, History,
  Globe, Zap, MessageSquare, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';
import { useNotifications } from '@/context/NotificationContext';

const AdminNotifications = () => {
  const [activeType, setActiveType] = useState('INFO');
   const { notifications: liveNotifications, loading, fetchNotifications, markAsRead } = useNotifications();
   const [title, setTitle] = useState('');
   const [message, setMessage] = useState('');
   const [targets, setTargets] = useState<Record<string, boolean>>({
      drivers: true,
      admins: true,
      agencies: true,
      global: false,
   });

   const selectedRoles = useMemo(() => {
      if (targets.global) return ['DRIVER', 'AGENCY_ADMIN', 'ADMIN'];
      const roles: string[] = [];
      if (targets.drivers) roles.push('DRIVER');
      if (targets.admins) roles.push('ADMIN');
      if (targets.agencies) roles.push('AGENCY_ADMIN');
      return roles;
   }, [targets]);

   const notifications = useMemo(
      () => liveNotifications.map((item: unknown) => ({
         id: item.id,
         title: item.title || item.type || 'Notification',
         message: item.message,
         type: item.type || 'INFO',
         targets: (Array.isArray(item.targetRoles) && item.targetRoles.length > 0)
            ? item.targetRoles
            : [item.recipientRole || 'SYSTEM'],
         date: item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
         isRead: item.isRead,
      })),
      [liveNotifications]
   );

   useEffect(() => {
      fetchNotifications();
   }, [fetchNotifications]);

   const handleBroadcast = async () => {
      if (!title.trim() || !message.trim()) {
         toast.error('Titre et message requis');
         return;
      }
      if (selectedRoles.length === 0) {
         toast.error('Sélectionnez au moins une cible');
         return;
      }

      try {
         await adminService.broadcastNotification({
            title,
            message,
            type: activeType,
            targetRoles: selectedRoles,
         } as unknown);
         toast.success('Broadcast envoyé');
         setTitle('');
         setMessage('');
         await fetchNotifications();
      } catch (error) {
         toast.error('Échec de l’envoi du broadcast');
      }
   };

   const handleMarkRead = async (id: string) => {
      try {
         await markAsRead(id);
      } catch {
         toast.error('Impossible de marquer comme lu');
      }
   };

  return (
    <div className="space-y-10 pb-20 font-sans selection:bg-primary/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                 Broadcast Center
              </Badge>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           </div>
           <h1 className="text-4xl font-black tracking-tight text-foreground uppercase leading-none">
              Platform <span className="text-indigo-500">Alerts</span>
           </h1>
           <p className="text-foreground/40 font-bold uppercase text-[10px] tracking-[0.2em] mt-3">
              Manage <span className="text-indigo-400">System-wide Broadcasts</span> and Operational Integrity
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
         {/* Left Column: Notification History */}
         <div className="lg:col-span-3 space-y-8">
            <Card className="premium-glass p-10 border-none overflow-hidden relative">
               <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <History className="w-4 h-4 text-indigo-500" /> Broadcast History
                     </h3>
                     <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/20" />
                        <Input placeholder="Search logs..." className="h-10 pl-10 pr-4 rounded-xl border-border/40 bg-card/50 focus:border-indigo-500/50 text-xs font-bold" />
                     </div>
                  </div>

                  <div className="space-y-4">
                     {notifications.map((notif) => (
                       <motion.div
                         key={notif.id}
                         initial={{ opacity: 0, x: -20 }}
                         animate={{ opacity: 1, x: 0 }}
                         className="p-6 rounded-[32px] bg-card/30 border border-border/40 hover:bg-card/50 transition-all group cursor-pointer"
                       >
                          <div className="flex items-start justify-between gap-6 mb-4">
                             <div className="flex items-start gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                                  notif.type === 'INFO' ? "bg-indigo-600/20 text-indigo-400" :
                                  notif.type === 'WARNING' ? "bg-amber-600/20 text-amber-400" :
                                  "bg-rose-600/20 text-rose-400"
                                )}>
                                   {notif.type === 'INFO' ? <Info className="w-6 h-6" /> : 
                                    notif.type === 'WARNING' ? <AlertTriangle className="w-6 h-6" /> : 
                                    <ShieldAlert className="w-6 h-6" />}
                                </div>
                                <div>
                                   <p className="text-xs font-black text-foreground uppercase tracking-tight leading-none mb-2">{notif.title}</p>
                                   <div className="flex items-center gap-3">
                                      <span className="text-[9px] font-bold text-foreground/20 uppercase tracking-widest">{notif.date}</span>
                                      <div className="w-1 h-1 rounded-full bg-white/10" />
                                      <div className="flex items-center gap-1.5">
                                         {notif.targets.map(t => (
                                           <span key={t} className="text-[8px] font-black text-indigo-500/60 uppercase tracking-widest">{t}</span>
                                         ))}
                                      </div>
                                   </div>
                                </div>
                             </div>
                             <Button onClick={() => handleMarkRead(notif.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-foreground/10 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                          </div>
                          <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest leading-relaxed">
                             {notif.message}
                          </p>
                       </motion.div>
                     ))}
                  </div>
               </div>
               
               {/* Background Glow */}
               <div className="absolute -top-40 -left-40 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
            </Card>
         </div>

         {/* Right Column: Broadcast Form */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="premium-glass p-10 border-none relative overflow-hidden h-full">
               <div className="relative z-10 space-y-10">
                  <div className="flex items-center gap-3">
                     <Zap className="w-5 h-5 text-indigo-500 animate-pulse" />
                     <h2 className="text-sm font-black text-foreground uppercase tracking-[0.3em]">Broadcast Node</h2>
                  </div>

                  <div className="space-y-8">
                     {/* Type Selector */}
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em] px-1">Alert Protocol</Label>
                        <div className="grid grid-cols-3 gap-3">
                           {['INFO', 'WARNING', 'ALERT'].map((t) => (
                             <button
                               key={t}
                               onClick={() => setActiveType(t)}
                               className={cn(
                                 "h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all border",
                                 activeType === t 
                                   ? (t === 'INFO' ? "bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-600/20" : 
                                      t === 'WARNING' ? "bg-amber-600 border-amber-500 shadow-xl shadow-amber-600/20" : 
                                      "bg-rose-600 border-rose-500 shadow-xl shadow-rose-600/20")
                                   : "bg-card/50 border-border/40 text-foreground/40 hover:text-foreground"
                               )}
                             >
                                <span className="text-[9px] font-black uppercase tracking-widest">{t}</span>
                             </button>
                           ))}
                        </div>
                     </div>

                     {/* Targets */}
                     <div className="space-y-4">
                        <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-[0.2em] px-1">Target Nodes</Label>
                        <div className="grid grid-cols-2 gap-4">
                           <TargetCheckbox label="Drivers" icon={Truck} id="drivers" checked={targets.drivers} onCheckedChange={(checked) => setTargets((prev) => ({ ...prev, drivers: checked }))} />
                           <TargetCheckbox label="Admins" icon={Users} id="admins" checked={targets.admins} onCheckedChange={(checked) => setTargets((prev) => ({ ...prev, admins: checked }))} />
                           <TargetCheckbox label="Agencies" icon={Building2} id="agencies" checked={targets.agencies} onCheckedChange={(checked) => setTargets((prev) => ({ ...prev, agencies: checked }))} />
                           <TargetCheckbox label="Global" icon={Globe} id="global" checked={targets.global} onCheckedChange={(checked) => setTargets({ drivers: false, admins: false, agencies: false, global: checked })} />
                        </div>
                     </div>

                     {/* Message Input */}
                     <div className="space-y-6 pt-4 border-t border-border/40">
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-1">Message Header</Label>
                           <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Urgent System Update..." className="h-14 bg-card/50 border-border/40 rounded-2xl px-6 font-bold text-foreground focus:border-indigo-500/50" />
                        </div>
                        <div className="space-y-3">
                           <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-1">Transmission Data</Label>
                           <Textarea 
                             value={message}
                             onChange={(e) => setMessage(e.target.value)}
                             placeholder="Enter mission parameters or alert details..." 
                             className="min-h-[160px] bg-card/50 border-border/40 rounded-3xl px-6 py-6 font-bold text-foreground focus:border-indigo-500/50 resize-none" 
                           />
                        </div>
                     </div>

                     <Button onClick={handleBroadcast} className="w-full h-18 rounded-[24px] bg-indigo-600 hover:bg-indigo-500 text-foreground font-black uppercase text-[10px] tracking-[0.3em] shadow-2xl shadow-indigo-600/20 transition-all active:scale-95">
                        <Send className="w-4 h-4 mr-3" /> Transmit Broadcast
                     </Button>
                  </div>
               </div>
               
               {/* Background Glow */}
               <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
            </Card>
         </div>
      </div>
    </div>
  );
};

const TargetCheckbox = ({ label, icon: Icon, id, checked, onCheckedChange }: unknown) => (
  <div className="flex items-center space-x-3 p-4 rounded-2xl bg-card/30 border border-border/40 hover:bg-card/50 transition-all group">
     <Checkbox id={id} checked={checked} onCheckedChange={(value) => onCheckedChange(!!value)} className="border-white/20 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600" />
     <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
        <Icon className="w-3.5 h-3.5 text-foreground/20 group-hover:text-indigo-400 transition-colors" />
        <span className="text-[10px] font-black text-foreground/40 group-hover:text-foreground uppercase tracking-widest transition-colors">{label}</span>
     </label>
  </div>
);

export default AdminNotifications;
