import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ChevronLeft, Camera, Star, Zap, Truck, Clock,
  ShieldCheck, LogOut, Save, User, FileText, ChevronRight,
  Bell, Smartphone, Lock, AlertTriangle, Shield,
  ClipboardCheck, CreditCard, Fingerprint, Settings2,
  Loader2, Eye, Navigation, Building2, CheckCircle2,
  XCircle, Edit3, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import driverService from '@/services/api/driverService';
import { useDriverDashboard } from '@/hooks/useDriverDashboard';
import { useDriverPreferences } from '@/hooks/useDriverPreferences';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SettingItem = ({ icon: Icon, label, sublabel, value, action, isToggle, onToggle, badge, destructive, disabled, isSaving }: unknown) => (
  <motion.div
    whileTap={{ scale: 0.98 }}
    className={cn(
      "flex items-center justify-between py-5 group cursor-pointer transition-all border-b border-border last:border-0",
      disabled && "opacity-40 pointer-events-none"
    )}
    onClick={!isToggle ? action : undefined}
  >
    <div className="flex items-center gap-4">
      <div className={cn(
        "w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center group-hover:bg-muted/80 group-hover:border-primary/20 transition-all shadow-inner",
        value && isToggle && "bg-primary/10 border-primary/30",
        destructive && "group-hover:bg-rose-500/10 group-hover:border-rose-500/20"
      )}>
        <Icon size={20} className={cn(
          value && isToggle ? "text-primary" : (destructive ? "text-rose-500" : "text-muted-foreground group-hover:text-foreground")
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn("text-sm font-black tracking-tight", destructive ? "text-rose-500" : "text-foreground")}>{label}</p>
          {badge && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest border",
              badge === 'VALIDE' || badge === 'ACTIVE' || badge === 'VÉRIFIÉ'
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                : "bg-primary/10 border-primary/20 text-primary"
            )}>{badge}</span>
          )}
        </div>
        {sublabel && <p className={cn("text-[10px] font-bold uppercase tracking-[0.1em] mt-1.5", destructive ? "text-rose-500/40" : "text-muted-foreground")}>{sublabel}</p>}
      </div>
    </div>
    {isToggle ? (
      <div className="flex items-center gap-4">
        {isSaving ? (
          <div className="flex items-center gap-2">
            <Loader2 size={10} className="animate-spin text-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/50">Saving...</span>
          </div>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{value ? 'ON' : 'OFF'}</span>
        )}
        <Switch
          checked={value}
          onCheckedChange={onToggle}
          disabled={disabled || isSaving}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    ) : (
      <div className="flex items-center gap-2">
        {value && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{value}</span>}
        <ChevronRight size={16} className={destructive ? "text-destructive/20" : "text-muted-foreground group-hover:translate-x-1 transition-transform"} />
      </div>
    )}
  </motion.div>
);

const SettingSection = ({ title, icon: Icon, children, delay = 0 }: unknown) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="space-y-4 mb-8"
  >
    <div className="flex items-center gap-3 px-2">
      <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon size={12} className="text-primary" />
      </div>
      <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">{title}</h2>
    </div>
    <div className="bg-card border border-border rounded-[2.5rem] p-6 shadow-2xl overflow-hidden relative">
      <div className="absolute -right-20 -bottom-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      {children}
    </div>
  </motion.div>
);

// Parses documents JSON stored as string → { key: url }
function parseDocs(raw?: string): Record<string, string> {
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

function maskAccount(v: string) {
  if (v.length <= 4) return '****';
  return v.slice(0, 2) + '****' + v.slice(-4);
}

const DOC_LABELS: Record<string, string> = {
  idFront: "CIN Recto",
  idBack: "CIN Verso",
  drivingLicense: "Permis de Conduire",
  selfie: "Selfie d'identité",
  profilePhoto: "Photo de Profil",
  insurancePhoto: "Attestation d'Assurance",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const DriverProfile: React.FC = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dashboard } = useDriverDashboard();
  const isOnline = !!dashboard.data?.isOnline;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => driverService.getProfile(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  // ── Form state ──
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    vehiclePlate: '',
    licenseNumber: '',
  });

  // Banking edit state
  const [editingBanking, setEditingBanking] = useState(false);
  const [bankForm, setBankForm] = useState({ bankAccount: '', bankAccountHolder: '' });

  useEffect(() => {
    if (!profile && !user) return;
    setFormData({
      firstName:     profile?.firstName     ?? user?.firstName    ?? '',
      lastName:      profile?.lastName      ?? user?.lastName     ?? '',
      phoneNumber:   profile?.phoneNumber   ?? user?.phoneNumber  ?? '',
      vehiclePlate:  profile?.vehiclePlate  ?? '',
      licenseNumber: profile?.licenseNumber ?? '',
    });
    setBankForm({
      bankAccount:       profile?.bankAccount       ?? '',
      bankAccountHolder: profile?.bankAccountHolder ?? '',
    });
  }, [profile, user]);

  const prefs = useDriverPreferences();
  const documents = parseDocs(profile?.documents);
  const docCount = Object.keys(documents).length;

  // ── Mutations ──
  const updateMutation = useMutation({
    mutationFn: (data: typeof formData & typeof bankForm) =>
      driverService.updateProfile({
        firstName:         data.firstName     || undefined,
        lastName:          data.lastName      || undefined,
        phoneNumber:       data.phoneNumber   || undefined,
        vehiclePlate:      data.vehiclePlate  || undefined,
        licenseNumber:     data.licenseNumber || undefined,
        bankAccount:       data.bankAccount       || undefined,
        bankAccountHolder: data.bankAccountHolder || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      if (user) setUser({ ...user, firstName: updated.firstName, lastName: updated.lastName, phoneNumber: updated.phoneNumber });
      setEditingBanking(false);
      toast.success('Profil mis à jour !');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => driverService.uploadAvatar(file),
    onSuccess: (data) => {
      if (user) setUser({ ...user, avatarUrl: data.avatarUrl });
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      toast.success('Photo mise à jour !');
    },
    onError: () => toast.error("Erreur lors de l'envoi de la photo"),
  });
  
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  
  const uploadDocMutation = useMutation({
    mutationFn: async ({ key, file }: { key: string, file: File }) => {
      const { url } = await driverService.uploadDocument(file);
      const currentDocs = parseDocs(profile?.documents);
      const newDocs = { ...currentDocs, [key]: url };
      return driverService.updateProfile({ documents: JSON.stringify(newDocs) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
      toast.success('Document mis à jour !');
    },
    onError: () => toast.error("Erreur lors de l'envoi du document"),
    onSettled: () => setUploadingDoc(null),
  });

  const handleDocumentUpload = (key: string, file: File) => {
    if (file.size > 5 * 1024 * 1024) return toast.error('Fichier trop volumineux (max 5MB)');
    setUploadingDoc(key);
    uploadDocMutation.mutate({ key, file });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image trop volumineuse (max 2MB)'); return; }
    uploadAvatarMutation.mutate(file);
  };

  const handleSave = () => updateMutation.mutate({ ...formData, ...bankForm });

  const handleLogout = () => { logout(); navigate('/login'); };

  const displayName = `${formData.firstName} ${formData.lastName}`.trim() || 'Driver';
  const rating = profile?.rating ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32 relative overflow-x-hidden selection:bg-primary/30">

      {/* Glow background */}
      <motion.div
        animate={{ opacity: isOnline ? [0.2, 0.4, 0.2] : [0.1, 0.15, 0.1], scale: isOnline ? [1, 1.1, 1] : 1 }}
        transition={{ duration: 5, repeat: Infinity }}
        className={cn(
          "fixed top-0 left-1/2 -translate-x-1/2 w-[150%] h-[600px] blur-[140px] rounded-full pointer-events-none transition-colors duration-1000",
          isOnline ? "bg-emerald-500/20" : "bg-primary/20"
        )}
      />

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-3xl border-b border-border px-6 pt-8 pb-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/driver/dashboard')}
              className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-inner"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight">Centre de Contrôle</h1>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 leading-none">Identité & Paramètres</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="h-11 px-6 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] tracking-widest uppercase flex items-center gap-3 shadow-xl shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {updateMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>Sauvegarder</span>
          </button>
        </div>
      </div>

      {/* Auto-accept warning */}
      <AnimatePresence>
        {prefs.autoAccept && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-amber-500 overflow-hidden"
          >
            <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-3 text-background">
              <AlertTriangle size={16} className="shrink-0" />
              <p className="text-[10px] font-black uppercase tracking-widest">Missions auto-acceptées en arrière-plan</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-6 mt-8 relative z-10">

        {/* ── IDENTITY HUD ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "rounded-[3rem] p-10 mb-10 relative overflow-hidden shadow-2xl border transition-all duration-1000",
            isOnline ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card border-border"
          )}
        >
          <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
            {/* Avatar */}
            <div className="relative group cursor-pointer">
              <input type="file" id="avatar-upload" className="hidden" accept="image/jpeg,image/png" onChange={handleAvatarChange} />
              <label htmlFor="avatar-upload" className="cursor-pointer block">
                <div className={cn(
                  "w-28 h-28 rounded-[2.5rem] flex items-center justify-center p-1 shadow-2xl transition-all duration-1000",
                  isOnline ? "bg-gradient-to-tr from-emerald-500 to-teal-400" : "bg-gradient-to-tr from-primary to-purple-400"
                )}>
                  <div className="w-full h-full bg-background rounded-[2.2rem] flex items-center justify-center overflow-hidden relative">
                    {uploadAvatarMutation.isPending ? (
                      <Loader2 size={32} className="animate-spin text-primary" />
                    ) : user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-black">{formData.firstName?.charAt(0).toUpperCase() || '?'}</span>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              </label>
              {/* Verification badge */}
              <div className={cn(
                "absolute -bottom-1 -right-1 p-2.5 rounded-2xl border-4 border-background shadow-lg",
                profile?.verificationStatus === 'VERIFIED' ? "bg-emerald-500" :
                profile?.verificationStatus === 'PENDING'  ? "bg-amber-500"   : "bg-rose-500"
              )}>
                {profile?.verificationStatus === 'VERIFIED' ? <ShieldCheck size={14} className="text-white" /> :
                 profile?.verificationStatus === 'PENDING'  ? <Clock size={14} className="text-white" />       :
                 <Shield size={14} className="text-white" />}
              </div>
            </div>

            {/* Name & status */}
            <div className="text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">{displayName}</h3>
                <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black text-primary tracking-widest uppercase">
                  {profile?.loyaltyPoints != null ? `${profile.loyaltyPoints} PTS` : 'DRIVER'}
                </div>
              </div>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-1.5">
                  <Star size={12} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-black text-foreground/80">
                    {rating > 0 ? rating.toFixed(2) : '—'}
                  </span>
                  {(profile?.ratingCount ?? 0) > 0 && (
                    <span className="text-[9px] text-muted-foreground">({profile!.ratingCount})</span>
                  )}
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-border" />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">ID: {user?.id?.substring(0, 8).toUpperCase() ?? 'DRV-UNIT'}</p>
              </div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <div className={cn(
                  "px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border flex items-center gap-2 transition-all duration-1000",
                  isOnline ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" : "bg-muted border-border text-muted-foreground"
                )}>
                  <span>{isOnline ? '🟢 OPÉRATIONNEL' : '🔴 HORS SERVICE'}</span>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border",
                  profile?.verificationStatus === 'VERIFIED' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" :
                  profile?.verificationStatus === 'PENDING'  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"    :
                  "bg-rose-500/10 border-rose-500/30 text-rose-500"
                )}>
                  {profile?.verificationStatus ?? 'INCONNU'}
                </div>
                {profile?.agencyName && (
                  <div className="px-3 py-1.5 rounded-full text-[9px] font-black tracking-widest uppercase border bg-card border-border text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={10} />
                    <span>{profile.agencyName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT COLUMN */}
          <div className="space-y-2">

            {/* Identity */}
            <SettingSection title="Identité & Contact" icon={User} delay={0.1}>
              {isLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 size={24} className="animate-spin text-primary" /></div>
              ) : (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    {(['firstName', 'lastName'] as const).map((field) => (
                      <div key={field} className="space-y-2">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">
                          {field === 'firstName' ? 'Prénom' : 'Nom'}
                        </label>
                        <input
                          type="text"
                          value={formData[field]}
                          onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                          className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner text-foreground"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">Email</label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      disabled
                      className="w-full h-14 bg-muted/50 border border-border rounded-2xl px-4 text-sm font-bold outline-none shadow-inner text-muted-foreground cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">Téléphone</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner text-foreground"
                    />
                  </div>
                </div>
              )}
            </SettingSection>

            {/* Vehicle */}
            <SettingSection title="Unité Logistique" icon={Truck} delay={0.2}>
              <div className="space-y-2 pb-5 border-b border-border">
                <div className="flex items-center gap-4 py-1">
                  <div className="w-12 h-12 rounded-2xl bg-muted border border-border flex items-center justify-center shadow-inner">
                    <Truck size={20} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">Véhicule Assigné</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                      {profile?.vehicleType ?? '—'}
                      {isOnline && <span className="ml-2 text-amber-500">• Indisponible en mission</span>}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4 space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">Plaque d'Immatriculation</label>
                <input
                  type="text"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  disabled={isOnline}
                  placeholder="MA-1234-XX"
                  className={cn(
                    "w-full h-14 border rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner",
                    isOnline ? "bg-muted/50 text-muted-foreground cursor-not-allowed border-border" : "bg-card border-border text-foreground"
                  )}
                />
              </div>
            </SettingSection>

            {/* Documents */}
            <SettingSection title="Documents & Conformité" icon={ClipboardCheck} delay={0.3}>
              {/* License number */}
              <div className="pb-5 border-b border-border space-y-2">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">N° Permis de Conduire</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                    placeholder="Ex: B-123456"
                    className="w-full h-14 bg-card border border-border rounded-2xl px-4 pr-10 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner text-foreground"
                  />
                  <ShieldCheck size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Uploaded documents */}
              <div className="pt-4 space-y-3">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-3">
                  Fichiers soumis ({docCount})
                </p>
                
                {Object.entries(DOC_LABELS).map(([key, label]) => {
                  const url = documents[key];
                  const isUploading = uploadingDoc === key;
                  
                  return (
                    <div key={key} className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-2xl border transition-all",
                      url ? "bg-muted/50 border-border" : "bg-amber-500/5 border-amber-500/20"
                    )}>
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center shrink-0",
                          url ? "bg-emerald-500/10 border-emerald-500/20" : "bg-amber-500/10 border-amber-500/20"
                        )}>
                          {url ? <CheckCircle2 size={14} className="text-emerald-500" /> : <FileText size={14} className="text-amber-500" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">{label}</p>
                          <p className={cn(
                            "text-[9px] uppercase tracking-widest font-bold",
                            url ? "text-emerald-500/60" : "text-amber-500/60"
                          )}>
                            {url ? 'SOUMIS' : 'MANQUANT'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-sm"
                            title="Voir le document"
                          >
                            <Eye size={14} className="text-muted-foreground" />
                          </a>
                        )}
                        <label className={cn(
                          "w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-all shadow-sm",
                          isUploading ? "bg-primary/20 border-primary" : "bg-card border-border hover:bg-muted"
                        )} title="Mettre à jour">
                          {isUploading ? <Loader2 size={14} className="animate-spin text-primary" /> : <Edit3 size={14} className="text-muted-foreground" />}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocumentUpload(key, file);
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SettingSection>

            {/* Banking */}
            <SettingSection title="RIB & Infos Bancaires" icon={CreditCard} delay={0.35}>
              <div className="space-y-4">
                {!editingBanking ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Titulaire du compte</p>
                        <p className="text-sm font-black text-foreground">
                          {bankForm.bankAccountHolder || <span className="text-muted-foreground italic font-normal text-xs">Non renseigné</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => setEditingBanking(true)}
                        className="w-9 h-9 rounded-xl bg-muted border border-border flex items-center justify-center hover:bg-primary/10 hover:border-primary/20 transition-colors"
                      >
                        <Edit3 size={14} className="text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Numéro de compte / IBAN</p>
                      <p className="text-sm font-bold text-foreground font-mono tracking-widest">
                        {bankForm.bankAccount
                          ? maskAccount(bankForm.bankAccount)
                          : <span className="text-muted-foreground italic font-sans font-normal text-xs">Non renseigné</span>}
                      </p>
                    </div>
                    {bankForm.bankAccount && (
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 size={13} className="text-emerald-500" />
                        <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Coordonnées vérifiées</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em]">Modifier les infos bancaires</p>
                      <button
                        onClick={() => {
                          setBankForm({ bankAccount: profile?.bankAccount ?? '', bankAccountHolder: profile?.bankAccountHolder ?? '' });
                          setEditingBanking(false);
                        }}
                        className="w-7 h-7 rounded-lg bg-muted border border-border flex items-center justify-center hover:bg-rose-500/10 hover:border-rose-500/20 transition-colors"
                      >
                        <X size={12} className="text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">Titulaire du compte</label>
                      <input
                        type="text"
                        value={bankForm.bankAccountHolder}
                        onChange={(e) => setBankForm({ ...bankForm, bankAccountHolder: e.target.value })}
                        placeholder="Nom complet"
                        className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">IBAN / Numéro de compte</label>
                      <input
                        type="text"
                        value={bankForm.bankAccount}
                        onChange={(e) => setBankForm({ ...bankForm, bankAccount: e.target.value })}
                        placeholder="MA76 0000 0000 0000 0000 0000"
                        className="w-full h-14 bg-card border border-border rounded-2xl px-4 text-sm font-bold font-mono focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner text-foreground"
                      />
                    </div>
                    <button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-[10px] tracking-widest uppercase flex items-center justify-center gap-2 shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {updateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      <span>Enregistrer</span>
                    </button>
                  </div>
                )}
              </div>
            </SettingSection>

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-2">

            {/* Mission preferences */}
            <SettingSection title="Préférences Mission" icon={Settings2} delay={0.4}>
              <SettingItem
                icon={Zap}
                label="Acceptation Automatique"
                isToggle={true}
                value={prefs.autoAccept}
                onToggle={(v: boolean) => prefs.update('autoAccept', v)}
                isSaving={prefs.isSaving.autoAccept}
                sublabel="Missions attribuées sans délai"
              />
              <SettingItem
                icon={Bell}
                label="Alertes Push"
                isToggle={true}
                value={prefs.notifications}
                onToggle={(v: boolean) => prefs.update('notifications', v)}
                isSaving={prefs.isSaving.notifications}
              />
              <SettingItem
                icon={Smartphone}
                label="Notifications Sonores"
                isToggle={true}
                value={prefs.sound}
                onToggle={(v: boolean) => prefs.update('sound', v)}
                isSaving={prefs.isSaving.sound}
              />
            </SettingSection>

            {/* Navigation */}
            <SettingSection title="Navigation & Interface" icon={Navigation} delay={0.5}>
              <SettingItem
                icon={Navigation}
                label="Google Maps Engine"
                isToggle={true}
                value={prefs.googleMaps}
                onToggle={(v: boolean) => prefs.update('googleMaps', v)}
                isSaving={prefs.isSaving.googleMaps}
                badge="DEFAULT"
              />
              <SettingItem
                icon={Eye}
                label="Mode Sombre (Carte)"
                isToggle={true}
                value={prefs.darkMap}
                onToggle={(v: boolean) => prefs.update('darkMap', v)}
                isSaving={prefs.isSaving.darkMap}
              />
            </SettingSection>

            {/* Security */}
            <SettingSection title="Sécurité & Session" icon={Lock} delay={0.6}>
              {/* Verification status details */}
              {profile?.verificationStatus === 'REJECTED' && profile?.rejectionReason && (
                <div className="mb-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
                  <div className="flex items-start gap-3">
                    <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-1">Compte refusé</p>
                      <p className="text-xs text-rose-500/70">{profile.rejectionReason}</p>
                    </div>
                  </div>
                </div>
              )}
              {profile?.disciplinaryStatus && profile.disciplinaryStatus !== 'ACTIVE' && (
                <div className="mb-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-500 uppercase tracking-widest mb-1">
                        Statut : {profile.disciplinaryStatus}
                      </p>
                      {profile.lastDisciplinaryReason && (
                        <p className="text-xs text-amber-500/70">{profile.lastDisciplinaryReason}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <SettingItem
                icon={Fingerprint}
                label="Modifier le Mot de Passe"
                sublabel="Sécurité renforcée"
                action={() => navigate('/driver/security/password')}
              />

              {/* Logout dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <div className="flex items-center justify-between py-5 group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center group-hover:bg-rose-500/20 transition-all">
                        <LogOut size={20} className="text-rose-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-rose-500">Terminer la Session</p>
                        <p className="text-[10px] font-bold text-rose-500/40 uppercase tracking-widest mt-1.5">Déconnexion sécurisée</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-rose-500/20 group-hover:translate-x-1 transition-transform" />
                  </div>
                </DialogTrigger>
                <DialogContent className="bg-card border border-border rounded-[3rem] p-10 max-w-sm mx-auto shadow-2xl">
                  <DialogHeader className="space-y-8">
                    <div className="w-24 h-24 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
                      <AlertTriangle className="text-rose-500" size={40} />
                    </div>
                    <div className="text-center space-y-4">
                      <DialogTitle className="text-3xl font-black text-foreground uppercase tracking-tighter">Déconnexion ?</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-sm font-bold uppercase tracking-widest leading-relaxed">
                        Souhaitez-vous vraiment quitter votre poste opérationnel ?
                      </DialogDescription>
                    </div>
                  </DialogHeader>
                  <div className="flex gap-4 mt-12">
                    <DialogClose asChild>
                      <Button variant="ghost" className="flex-1 h-16 rounded-2xl bg-muted border border-border text-foreground font-black uppercase tracking-widest text-[10px] hover:bg-muted/80">
                        ANNULER
                      </Button>
                    </DialogClose>
                    <Button
                      onClick={handleLogout}
                      className="flex-1 h-16 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-600/30"
                    >
                      DÉCONNECTER
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </SettingSection>

          </div>
        </div>

        <div className="text-center mt-16 opacity-20">
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.6em]">CARGOLINK OPS • SYSTEM BUILD 2.0.42 • SECURED</p>
        </div>

      </div>
    </div>
  );
};

export default DriverProfile;
