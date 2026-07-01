import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2, MapPin, Truck, ArrowLeft, ShieldAlert,
  Camera, Info, ShieldCheck, Activity,
  Lock, Unlock, RefreshCw, Edit3, X, Loader2
} from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import adminService, { Agency } from '@/services/api/adminService';
import { cn } from '@/lib/utils';
import { uploadImage } from '@/services/api/uploadService';
import AgencyWizard from './create-agency/AgencyWizard';

const AgencyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [agencyData, setAgencyData] = useState<Agency | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const fetchAgencyData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const agency = await adminService.getAgency(id);
      setAgencyData(agency);
    } catch (error) {
      toast.error("Failed to load agency details");
      navigate('/admin/agencies');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchAgencyData();
  }, [fetchAgencyData]);

  const onLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const url = await uploadImage(file);
      // Update logo directly via API
      if (id && agencyData) {
        await adminService.updateAgency(id, {
            agency: { ...agencyData, logoUrl: url }
        } as unknown);
        setAgencyData({ ...agencyData, logoUrl: url });
        toast.success('Logo updated successfully');
      }
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!agencyData?.id) return;
    const shouldSuspend = agencyData.status === 'ACTIVE';
    try {
      if (shouldSuspend) {
        await adminService.suspendAgency(agencyData.id, 'Suspended by admin');
      } else {
        await adminService.activateAgency(agencyData.id);
      }
      toast.success(shouldSuspend ? 'Agency suspended' : 'Agency reactivated');
      fetchAgencyData();
    } catch {
      toast.error('Failed to update agency status');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-40 w-full rounded-[40px] bg-accent/20" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 bg-accent/20 rounded-[32px]" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-10 font-sans selection:bg-indigo-500/30 relative z-10 pb-20">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-[5%] w-[30%] h-[30%] bg-indigo-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[10%] -right-[5%] w-[30%] h-[30%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 relative z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/admin/agencies')} className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-accent/20 dark:bg-white/5 border border-border dark:border-white/10 hover:bg-accent/30 dark:hover:bg-white/10 text-muted-foreground dark:text-white/40 hover:text-foreground dark:hover:text-white shrink-0">
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                Management Console
              </Badge>
            </div>
            <h1 className="text-xl md:text-5xl font-black uppercase tracking-tighter text-foreground truncate">Agency Details</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
                "h-12 md:h-14 px-6 md:px-8 flex-1 md:flex-none rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 gap-2 md:gap-3",
                isEditing ? "bg-rose-600 hover:bg-rose-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            {isEditing ? <><X className="w-4 h-4" /> Cancel Edit</> : <><Edit3 className="w-4 h-4" /> Modify Configuration</>}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <AgencyWizard 
              mode="edit" 
              initialData={agencyData || undefined} 
              id={id} 
              onSuccess={() => {
                  setIsEditing(false);
                  fetchAgencyData();
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4 md:space-y-8"
          >
            {/* Hero Header */}
            <Card className="border-none bg-indigo-600 rounded-[2rem] md:rounded-[40px] p-5 md:p-10 relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 md:gap-8">
                    <div className="relative group">
                        <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl md:rounded-[2rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center font-black text-3xl md:text-4xl text-white shadow-xl overflow-hidden">
                        {agencyData?.logoUrl ? (
                            <img src={agencyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        ) : (
                            agencyData?.name?.substring(0, 2).toUpperCase() || 'AG'
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                            <label htmlFor="logo-upload" className="cursor-pointer">
                            <Camera className="w-6 h-6 text-white" />
                            </label>
                        </div>
                        </div>
                        <input id="logo-upload" type="file" className="hidden" onChange={onLogoUpload} accept="image/*" />
                        {uploadingLogo && <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[2rem]"><Loader2 className="w-6 h-6 animate-spin text-white" /></div>}
                    </div>
                    
                    <div>
                    <Badge className={cn(
                        "font-black text-[9px] md:text-[10px] uppercase tracking-widest px-3 md:px-4 py-1 md:py-1.5 mb-3 md:mb-4 border-none shadow-lg",
                        agencyData?.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                        agencyData?.status === 'SUSPENDED' ? 'bg-rose-500 text-white' :
                        'bg-white/20 text-white/70'
                    )}>
                        {agencyData?.status || 'UNKNOWN'}
                    </Badge>
                    <h2 className="text-2xl md:text-5xl font-black uppercase tracking-tighter text-white leading-tight drop-shadow-md text-center sm:text-left">
                        {agencyData?.name}
                    </h2>
                    <p className="text-indigo-100/80 font-bold uppercase text-[10px] tracking-widest mt-2 flex items-center justify-center sm:justify-start gap-2">
                        <MapPin className="w-4 h-4" />
                        {agencyData?.address || 'No address on record'} · {agencyData?.city}
                    </p>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 items-center sm:items-end w-full lg:w-auto">
                    <div className="flex items-center gap-3 md:gap-4 bg-white/5 backdrop-blur-xl rounded-xl md:rounded-2xl p-3 md:p-4 border border-white/10 w-full sm:w-auto justify-center">
                    <div className="text-right">
                        <p className="text-[8px] md:text-[10px] font-black text-white/60 uppercase tracking-widest">Fleet Capacity</p>
                        <p className="text-lg md:text-xl font-black text-white">{agencyData?.driversCount || 0} / {agencyData?.maxDrivers || '∞'}</p>
                    </div>
                    <Truck className="w-6 h-6 md:w-8 md:h-8 text-indigo-300" />
                    </div>
                </div>
                </div>
                <Building2 className="absolute -right-20 -bottom-20 w-80 h-80 text-black/10 rotate-12" />
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {/* Manager Summary */}
                <Card className="border-none bg-card/60 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-6 md:p-8 border border-border/50 dark:border-white/[0.05] shadow-xl space-y-4 md:space-y-6 hover:bg-card/80 dark:hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                            <Info className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground dark:text-white">Manager Info</h4>
                            <p className="text-[10px] font-bold text-muted-foreground dark:text-white/25 uppercase tracking-widest">Primary Contact</p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-2">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Full Name</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{agencyData?.adminAgencyName || 'Not Assigned'}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Email</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{agencyData?.email}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Phone</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{agencyData?.phone || '—'}</p>
                        </div>
                    </div>
                </Card>

                {/* Operations Summary */}
                <Card className="border-none bg-card/60 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-6 md:p-8 border border-border/50 dark:border-white/[0.05] shadow-xl space-y-4 md:space-y-6 hover:bg-card/80 dark:hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-foreground dark:text-white">Operations</h4>
                            <p className="text-[10px] font-bold text-muted-foreground dark:text-white/25 uppercase tracking-widest">Performance Config</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Hours</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{agencyData?.openingHour} - {agencyData?.closingHour}</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Comm. Rate</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{Number(agencyData?.commissionRate || 0) * 100}%</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Salary</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{agencyData?.managerSalary} MAD</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 dark:text-white/20 mb-1">Auto-Dispatch</p>
                            <p className="text-sm font-bold text-foreground dark:text-white">{agencyData?.autoDispatch ? 'ON' : 'OFF'}</p>
                        </div>
                    </div>
                </Card>

                {/* Status Controls */}
                <Card className="border-none bg-card/60 dark:bg-white/[0.02] backdrop-blur-3xl rounded-[2rem] md:rounded-[40px] p-6 md:p-8 border border-border/50 dark:border-white/[0.05] shadow-xl space-y-4 md:space-y-6 hover:bg-card/80 dark:hover:bg-white/[0.04] transition-all flex flex-col justify-between">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-sm font-black uppercase tracking-tight text-foreground dark:text-white">Security</h4>
                                <p className="text-[10px] font-bold text-muted-foreground dark:text-white/25 uppercase tracking-widest">Access Control</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/20 dark:bg-white/[0.03] border border-border/40 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                {agencyData?.status === 'ACTIVE' ? <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground dark:text-white/40">Status</p>
                            </div>
                            <Button
                                variant="ghost"
                                onClick={handleToggleStatus}
                                className={cn(
                                    "h-8 px-4 rounded-lg font-black text-[8px] uppercase tracking-widest",
                                    agencyData?.status === 'ACTIVE' ? "bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20"
                                )}
                            >
                                {agencyData?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                            </Button>
                        </div>
                    </div>

                    <Button variant="ghost" onClick={fetchAgencyData} className="h-12 w-full rounded-2xl bg-accent/20 dark:bg-white/5 border border-border dark:border-white/10 text-muted-foreground/60 dark:text-white/30 hover:text-foreground dark:hover:text-white font-black text-[10px] uppercase tracking-widest gap-2">
                        <RefreshCw className="w-3 h-3" /> Sync Latest Data
                    </Button>
                </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AgencyDetails;
