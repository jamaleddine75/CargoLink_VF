import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  User, Building2, Globe, Activity, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, Rocket, ArrowLeft,
  Sparkles, Save, ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  managerSchema, agencySchema, locationSchema, operationsSchema,
  STEP_LABELS, CreateAgencyPayload, UpdateAgencyPayload,
  type ManagerData, type AgencyData, type LocationData, type OperationsData,
} from './schemas';
import StepManager from './StepManager';
import StepAgency from './StepAgency';
import StepLocation from './StepLocation';
import StepOperations from './StepOperations';
import StepReview from './StepReview';
import apiClient from '@/api/client';
import adminService, { Agency } from '@/services/api/adminService';

const STEP_ICONS = [User, Building2, Globe, Activity, CheckCircle2];
const STEP_COLORS = ['blue', 'indigo', 'emerald', 'amber', 'violet'] as const;

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

interface AgencyWizardProps {
  mode?: 'create' | 'edit';
  initialData?: Agency;
  id?: string;
  onSuccess?: () => void;
}

const AgencyWizard: React.FC<AgencyWizardProps> = ({ mode = 'create', initialData, id, onSuccess }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const initializedRef = React.useRef<string | null>(null);
  const isEdit = mode === 'edit';


  const managerForm = useForm<ManagerData>({
    resolver: zodResolver(managerSchema),
    defaultValues: { fullName: '', email: '', phone: '', password: '', confirmPassword: '', role: 'AGENCY_MANAGER' },
    mode: 'onBlur',
  });

  const agencyForm = useForm<AgencyData>({
    resolver: zodResolver(agencySchema),
    defaultValues: { name: '', code: '', city: '', sector: '', address: '', agencyType: 'STANDARD', description: '', maxDrivers: 10, maxDailyOrders: 100 },
    mode: 'onBlur',
  });

  const locationForm = useForm<LocationData>({
    resolver: zodResolver(locationSchema),
    defaultValues: { lat: 35.7595, lng: -5.8340, fullAddress: '', city: '', sector: '' },
    mode: 'onBlur',
  });

  const operationsForm = useForm<OperationsData>({
    resolver: zodResolver(operationsSchema),
    defaultValues: { openingHour: '08:00', closingHour: '18:00', workingDays: ['Mon','Tue','Wed','Thu','Fri'], salary: 5000, commissionRate: 15, bonus: 0, autoDispatch: true, maxConcurrentDeliveries: 5, maxEmployees: 10, operationalStatus: 'ACTIVE' },
    mode: 'onBlur',
  });

  // Prefill data if in edit mode - only once per ID to prevent overwriting user edits
  useEffect(() => {
    if (isEdit && initialData && id !== initializedRef.current) {
      console.log(`[Wizard] Initializing edit mode for agency ${id}`, initialData);
      initializedRef.current = id || 'unknown';
      
      // Manager
      managerForm.reset({
        fullName: initialData.adminAgencyName || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        role: 'AGENCY_MANAGER',
        password: '',
        confirmPassword: '',
        currentPassword: '',
      });

      // Agency
      agencyForm.reset({
        name: initialData.name || '',
        code: initialData.code || '',
        city: initialData.city || '',
        sector: initialData.sector || '',
        address: initialData.address || '',
        agencyType: (initialData.agencyType as any) || 'STANDARD',
        description: initialData.description || '',
        maxDrivers: initialData.maxDrivers ?? 10,
        maxDailyOrders: initialData.maxDailyOrders ?? 100,
      });

      // Location
      locationForm.reset({
        lat: initialData.latitude ?? 35.7595,
        lng: initialData.longitude ?? -5.8340,
        fullAddress: initialData.address || '',
        city: initialData.city || '',
        sector: initialData.sector || '',
      });

      // Operations
      operationsForm.reset({
        openingHour: initialData.openingHour || '08:00',
        closingHour: initialData.closingHour || '18:00',
        workingDays: initialData.workingDays ? initialData.workingDays.split(',').filter(Boolean) : ['Mon','Tue','Wed','Thu','Fri'],
        salary: initialData.managerSalary ?? 5000,
        commissionRate: (initialData.commissionRate !== undefined && initialData.commissionRate !== null) 
          ? Math.round(Number(initialData.commissionRate) * 100) 
          : 15,
        bonus: initialData.managerBonus ?? 0,
        autoDispatch: initialData.autoDispatch ?? true,
        maxConcurrentDeliveries: initialData.maxConcurrentDeliveries ?? 5,
        maxEmployees: initialData.maxEmployees ?? 10,
        operationalStatus: initialData.operationalStatus || 'ACTIVE',
      });
    }
  }, [isEdit, initialData, id, managerForm, agencyForm, locationForm, operationsForm]);



  const validateCurrentStep = async (): Promise<boolean> => {
    switch (step) {
      case 0: return managerForm.trigger();
      case 1: return agencyForm.trigger();
      case 2: return locationForm.trigger();
      case 3: return operationsForm.trigger();
      default: return true;
    }
  };

  const goNext = async () => {
    const valid = await validateCurrentStep();
    if (!valid) { 
      toast.error('Please fix the errors before continuing'); 
      console.log('Validation failed for step', step);
      return; 
    }
    setDirection(1);
    setStep(s => Math.min(s + 1, 4));
  };

  const goPrev = () => { setDirection(-1); setStep(s => Math.max(s - 1, 0)); };

  const goToStep = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const handleSubmit = async () => {
    console.log('[Wizard] Final submission initiated...');
    setSubmitting(true);
    
    // 1. Final comprehensive validation of ALL steps
    const validations = await Promise.all([
      managerForm.trigger(),
      agencyForm.trigger(),
      locationForm.trigger(),
      operationsForm.trigger(),
    ]);

    if (validations.some(v => !v)) {
      console.error('[Wizard] Validation failed on some steps', {
        manager: managerForm.formState.errors,
        agency: agencyForm.formState.errors,
        location: locationForm.formState.errors,
        operations: operationsForm.formState.errors,
      });
      toast.error('Validation failed. Please check all steps for errors.');
      setSubmitting(false);
      return;
    }

    const m = managerForm.getValues() as ManagerData;
    const a = agencyForm.getValues() as AgencyData;
    const l = locationForm.getValues() as LocationData;
    const o = operationsForm.getValues() as OperationsData;


    try {
      if (isEdit && id) {
        const payload: UpdateAgencyPayload = {
          manager: { 
            fullName: m.fullName, 
            email: m.email, 
            phone: m.phone,
            ...(m.password ? { password: m.password, currentPassword: m.currentPassword } : {})
          },

          agency: { ...a, notes: initialData?.notes, logoUrl: initialData?.logoUrl },
          location: { lat: l.lat, lng: l.lng },
          operations: { 
            ...o, 
            commissionRate: o.commissionRate / 100,
            workingDays: (o.workingDays || []).join(',') as any 
          },
        };
        console.log('[Wizard] Dispatching UPDATE payload:', payload);
        await adminService.updateAgency(id, payload);
        toast.success('Agency updated successfully!');
      } else {
        const payload: CreateAgencyPayload = {
          manager: { fullName: m.fullName, email: m.email, phone: m.phone, password: m.password || 'password123' },
          agency: a,
          location: { lat: l.lat, lng: l.lng },
          operations: { 
            ...o, 
            commissionRate: o.commissionRate / 100, 
            autoDispatch: o.autoDispatch, 
            maxEmployees: o.maxEmployees 
          } as any,

        };
        console.log('[Wizard] Dispatching CREATE payload:', payload);
        await apiClient.post('/admin/agencies', payload);
        toast.success('Agency created successfully!');
      }
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // Only navigate back if we're creating. If editing, we stay on the details page (handled by onSuccess)
      if (!isEdit) {
        setTimeout(() => navigate('/admin/agencies'), 2000);
      }
    } catch (err: any) {
      console.error('[Wizard] Submission failed:', err);
      toast.error(err?.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} agency`);
    } finally {
      setSubmitting(false);
    }
  };


  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-6">
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            className="w-24 h-24 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-emerald-400" />
          </motion.div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground dark:text-white">Agency {isEdit ? 'Updated' : 'Created'}</h2>
          <p className="text-sm font-bold text-muted-foreground dark:text-white/30">Redirecting to agencies...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar */}
      <div className="lg:w-72 shrink-0">
        <div className="lg:sticky lg:top-8 space-y-2 p-4 bg-white dark:bg-white/[0.02] border border-border dark:border-white/[0.05] rounded-3xl backdrop-blur-xl shadow-sm">
          {STEP_LABELS.map((label, i) => {
            const Icon = STEP_ICONS[i];
            const isActive = step === i;
            const isDone = step > i;
            const color = STEP_COLORS[i];
            return (
              <button key={i} type="button" onClick={() => (isDone || isActive) && goToStep(i)}
                className={cn(
                  'w-full flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-2xl transition-all text-left',
                  isActive ? 'bg-primary/10 dark:bg-white/[0.06] shadow-lg border border-primary/30' : isDone ? 'cursor-pointer hover:bg-accent/20 dark:hover:bg-white/[0.03]' : 'opacity-30 cursor-default'
                )}
              >
                <div className={cn(
                  'w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border transition-all shrink-0',
                  isActive ? `bg-${color}-500/10 border-${color}-500/40 text-${color}-600 dark:text-${color}-400 shadow-sm` :
                  isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                  'bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] text-muted-foreground/60 dark:text-white/30'
                )}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" /> : <Icon className="w-4 h-4 md:w-5 md:h-5" />}
                </div>
                <div className="min-w-0">
                  <p className={cn(
                    'text-[10px] font-black uppercase tracking-widest',
                    isActive ? 'text-foreground dark:text-white' : isDone ? 'text-foreground/70 dark:text-white/50' : 'text-muted-foreground/70 dark:text-white/30'
                  )}>
                    Step {i + 1}
                  </p>
                  <p className={cn(
                    'text-xs font-bold truncate',
                    isActive ? 'text-foreground/60 dark:text-white/60' : isDone ? 'text-muted-foreground/60 dark:text-white/25' : 'text-muted-foreground/50 dark:text-white/20'
                  )}>
                    {label}
                  </p>
                </div>
              </button>
            );
          })}
          <div className="px-4 pt-4">
            <div className="h-1.5 bg-accent/20 dark:bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                initial={false}
                animate={{ width: `${((step + 1) / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="p-4 sm:p-6 md:p-10 bg-white dark:bg-white/[0.015] border border-border dark:border-white/[0.05] rounded-3xl backdrop-blur-xl min-h-[500px] relative overflow-hidden shadow-sm">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {step === 0 && <StepManager form={managerForm} mode={mode} />}
              {step === 1 && <StepAgency form={agencyForm} />}
              {step === 2 && <StepLocation form={locationForm} />}
              {step === 3 && <StepOperations form={operationsForm} />}
              {step === 4 && (
                <StepReview
                  manager={managerForm.getValues()}
                  agency={agencyForm.getValues()}
                  location={locationForm.getValues()}
                  operations={operationsForm.getValues()}
                  onGoToStep={goToStep}
                  mode={mode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between mt-6">
          <Button type="button" variant="ghost" onClick={goPrev} disabled={step === 0}
            className="h-14 px-8 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-white/30 hover:text-foreground dark:hover:text-white hover:bg-accent/20 dark:hover:bg-white/5 disabled:opacity-10 gap-2">
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>

          {step < 4 ? (
            <Button type="button" onClick={goNext}
              className="h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_15px_40px_rgba(59,130,246,0.25)] border border-blue-400/20 gap-2 transition-all active:scale-95">
              Continue <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}
              className={cn(
                "h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 transition-all active:scale-95 disabled:opacity-50",
                isEdit ? "bg-indigo-600 hover:bg-indigo-500 shadow-[0_15px_40px_rgba(79,70,229,0.25)] border border-indigo-400/20" : "bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-[0_15px_40px_rgba(16,185,129,0.25)] border border-emerald-400/20"
              )}>
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {isEdit ? 'Saving...' : 'Creating...'}</> : <>{isEdit ? <Save className="w-4 h-4" /> : <Rocket className="w-4 h-4" />} {isEdit ? 'Save Changes' : 'Create Agency'}</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgencyWizard;
