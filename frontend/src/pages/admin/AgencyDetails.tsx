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
import PageHeader from '@/components/shared/PageHeader';

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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <PageHeader
        title="Agency Details"
        description="Operational configuration, manager and financial settings of the agency."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/agencies')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Agencies
            </Button>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? "destructive" : "default"}
              size="sm"
              className="gap-2"
            >
              {isEditing ? (
                <><X className="w-4 h-4" /> Cancel</>
              ) : (
                <><Edit3 className="w-4 h-4" /> Edit Agency</>
              )}
            </Button>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Hero Header Card */}
            <Card className="border border-primary/20 bg-primary text-primary-foreground rounded-lg p-6 shadow-sm overflow-hidden relative">
              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold text-2xl text-white shadow-sm overflow-hidden">
                      {agencyData?.logoUrl ? (
                        <img src={agencyData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        agencyData?.name?.substring(0, 2).toUpperCase() || 'AG'
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <Camera className="w-5 h-5 text-white" />
                        </label>
                      </div>
                    </div>
                    <input id="logo-upload" type="file" className="hidden" onChange={onLogoUpload} accept="image/*" />
                    {uploadingLogo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-lg">
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center sm:text-left">
                    <Badge className={cn(
                      "font-semibold text-[9px] uppercase tracking-wider px-2.5 py-0.5 mb-2 border-none shadow-sm",
                      agencyData?.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                      agencyData?.status === 'SUSPENDED' ? 'bg-rose-500 text-white' :
                      'bg-white/20 text-white/80'
                    )}>
                      {agencyData?.status || 'UNKNOWN'}
                    </Badge>
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white leading-tight">
                      {agencyData?.name}
                    </h2>
                    <p className="text-primary-foreground/80 text-[10px] font-medium uppercase tracking-wider mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {agencyData?.address || 'Address not provided'} · {agencyData?.city}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2 items-center sm:items-end w-full lg:w-auto">
                  <div className="flex items-center gap-3 bg-white/10 rounded-lg p-3 border border-white/15 w-full sm:w-auto justify-center">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-white/70 uppercase tracking-wider">Active Drivers</p>
                      <p className="text-base font-bold text-white">{agencyData?.driversCount || 0} / {agencyData?.maxDrivers || '∞'}</p>
                    </div>
                    <Truck className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Manager Card */}
              <Card className="border border-border bg-card rounded-lg shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                    <Info className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Agency Manager</h4>
                </div>
                <div className="space-y-3 pt-1">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Full Name</p>
                    <p className="text-xs font-semibold text-foreground">{agencyData?.adminAgencyName || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">E-mail</p>
                    <p className="text-xs font-semibold text-foreground">{agencyData?.email}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Phone</p>
                    <p className="text-xs font-semibold text-foreground">{agencyData?.phone || '—'}</p>
                  </div>
                </div>
              </Card>

              {/* Operations Card */}
              <Card className="border border-border bg-card rounded-lg shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Operations</h4>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Working Hours</p>
                    <p className="text-xs font-semibold text-foreground">{agencyData?.openingHour} - {agencyData?.closingHour}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Commission</p>
                    <p className="text-xs font-semibold text-foreground">{Number(agencyData?.commissionRate || 0) * 100}%</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Manager Salary</p>
                    <p className="text-xs font-semibold text-foreground">{agencyData?.managerSalary} MAD</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">Auto-Dispatch</p>
                    <p className="text-xs font-semibold text-foreground">{agencyData?.autoDispatch ? 'ACTIVE' : 'INACTIVE'}</p>
                  </div>
                </div>
              </Card>

              {/* Security & Sync Card */}
              <Card className="border border-border bg-card rounded-lg shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-foreground">Security & Access</h4>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border">
                    <div className="flex items-center gap-2">
                      {agencyData?.status === 'ACTIVE' ? (
                        <Unlock className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Lock className="w-4 h-4 text-rose-600" />
                      )}
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleToggleStatus}
                      className={cn(
                        "h-7 px-3 text-[9px] font-bold uppercase tracking-wider",
                        agencyData?.status === 'ACTIVE'
                          ? "text-rose-500 hover:text-rose-600 border-rose-200 hover:bg-rose-50"
                          : "text-emerald-500 hover:text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      )}
                    >
                      {agencyData?.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </Button>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchAgencyData}
                  className="w-full gap-2 mt-4 text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Sync Data
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
