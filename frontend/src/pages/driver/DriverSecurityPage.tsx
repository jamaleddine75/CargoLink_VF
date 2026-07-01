import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Fingerprint, Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { updatePassword } from '@/services/api/authService';
import { cn } from '@/lib/utils';

interface Rule {
  label: string;
  test: (v: string) => boolean;
}

const RULES: Rule[] = [
  { label: '8 caractères minimum', test: (v) => v.length >= 8 },
  { label: 'Une lettre majuscule', test: (v) => /[A-Z]/.test(v) },
  { label: 'Une lettre minuscule', test: (v) => /[a-z]/.test(v) },
  { label: 'Un chiffre', test: (v) => /\d/.test(v) },
  { label: 'Un caractère spécial (!@#$...)', test: (v) => /[^a-zA-Z0-9]/.test(v) },
];

const PasswordInput: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}> = ({ label, value, onChange, placeholder, disabled }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 tracking-[0.2em]">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-14 bg-card border border-border rounded-2xl px-4 pr-12 text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all shadow-inner text-foreground disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

const DriverSecurityPage: React.FC = () => {
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const allRulesPassed = RULES.every((r) => r.test(newPassword));
  const confirmMatches = newPassword === confirm && confirm.length > 0;
  const canSubmit = oldPassword.length > 0 && allRulesPassed && confirmMatches;

  const mutation = useMutation({
    mutationFn: () => updatePassword({ oldPassword, newPassword }),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
      navigate('/driver/profile');
    },
    onError: (err: unknown) => {
      const msg = err?.response?.data?.message;
      if (msg?.toLowerCase().includes('invalid') || msg?.toLowerCase().includes('incorrect')) {
        toast.error('Mot de passe actuel incorrect');
      } else {
        toast.error('Erreur lors du changement de mot de passe');
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-32 relative overflow-x-hidden">
      {/* Background glow */}
      <motion.div
        animate={{ opacity: [0.1, 0.2, 0.1] }}
        transition={{ duration: 5, repeat: Infinity }}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-primary/15 blur-[140px] rounded-full pointer-events-none"
      />

      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-3xl border-b border-border px-6 pt-8 pb-4">
        <div className="max-w-lg mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/driver/profile')}
            className="w-11 h-11 rounded-2xl bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors shadow-inner"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-black tracking-tight">Sécurité</h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-0.5 leading-none">
              Modifier le mot de passe
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 mt-8 relative z-10">
        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center mb-8"
        >
          <div className="w-20 h-20 rounded-[2rem] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-2xl">
            <Fingerprint size={36} className="text-primary" />
          </div>
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl space-y-6 mb-6"
          >
            <PasswordInput
              label="Mot de passe actuel"
              value={oldPassword}
              onChange={setOldPassword}
              placeholder="••••••••"
              disabled={mutation.isPending}
            />
            <PasswordInput
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="••••••••"
              disabled={mutation.isPending}
            />
            <PasswordInput
              label="Confirmer le nouveau mot de passe"
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
              disabled={mutation.isPending}
            />
          </motion.div>

          {/* Rules checklist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-[2.5rem] p-8 shadow-2xl mb-8"
          >
            <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em] mb-5">
              Règles de sécurité
            </p>
            <div className="space-y-3">
              {RULES.map((rule) => {
                const passed = newPassword.length > 0 && rule.test(newPassword);
                return (
                  <div key={rule.label} className="flex items-center gap-3">
                    {passed ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle size={16} className={cn("shrink-0", newPassword.length > 0 ? "text-rose-500" : "text-muted-foreground/30")} />
                    )}
                    <span className={cn(
                      "text-xs font-bold",
                      newPassword.length === 0 ? "text-muted-foreground" :
                      passed ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}
              {confirm.length > 0 && (
                <div className="flex items-center gap-3 pt-1 border-t border-border mt-3">
                  {confirmMatches ? (
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-rose-500 shrink-0" />
                  )}
                  <span className={cn("text-xs font-bold", confirmMatches ? "text-emerald-500" : "text-rose-500")}>
                    Les mots de passe correspondent
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            type="submit"
            disabled={!canSubmit || mutation.isPending}
            className={cn(
              "w-full h-16 rounded-[1.5rem] font-black text-[11px] tracking-widest uppercase flex items-center justify-center gap-3 shadow-xl transition-all",
              canSubmit && !mutation.isPending
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Modification en cours...</span>
              </>
            ) : (
              <>
                <Fingerprint size={18} />
                <span>Confirmer le changement</span>
              </>
            )}
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default DriverSecurityPage;
