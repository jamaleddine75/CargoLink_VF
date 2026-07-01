import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ManagerData } from './schemas';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';

const fieldAnim = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.06 } },
});

const PasswordStrength = ({ password }: { password: string }) => {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? colors[score - 1] : 'bg-white/5'}`} />
        ))}
      </div>
      <p className={`text-[9px] font-black uppercase tracking-widest ${score <= 1 ? 'text-red-500 dark:text-red-400' : score <= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {labels[score - 1] || 'Very Weak'}
      </p>
    </div>
  );
};

interface Props {
  form: UseFormReturn<ManagerData>;
  mode?: 'create' | 'edit';
}

const StepManager: React.FC<Props> = ({ form, mode = 'create' }) => {
  const { register, formState: { errors }, watch } = form;
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const pwd = watch('password') || '';
  const isEdit = mode === 'edit';


  const Field = ({ icon: Icon, label, name, type = 'text', placeholder, idx, rightEl }: unknown) => (
    <motion.div {...fieldAnim(idx)} className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/60 ml-1 flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <div className="relative">
        <Input
          type={type}
          placeholder={placeholder}
          {...register(name)}
          className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 pr-12 font-bold text-sm text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/15 focus:border-blue-500 focus:ring-0 transition-all hover:border-blue-500/50 dark:hover:border-white/10 shadow-sm"
        />
        {rightEl && <div className="absolute right-4 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
      {(errors as unknown)[name] && (
        <p className="text-[10px] text-rose-400 font-bold ml-1">{(errors as unknown)[name]?.message}</p>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white">Manager Account</h3>
            <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/25 uppercase tracking-widest">Set up the agency manager credentials</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field icon={User} label="Full Name" name="fullName" placeholder="John Doe" idx={0} />
        <Field icon={Mail} label="Email Address" name="email" placeholder="manager@agency.com" idx={1} />
        <Field icon={Phone} label="Phone Number" name="phone" placeholder="+212 6 00 00 00 00" idx={2} />
        <motion.div {...fieldAnim(3)} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/60 ml-1 flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" /> Role
          </label>
          <div className="h-14 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl flex items-center px-5 shadow-sm">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">AGENCY_MANAGER</span>
          </div>
          <input type="hidden" {...register('role')} value="AGENCY_MANAGER" />
        </motion.div>
      </div>

      {isEdit && (
        <motion.div {...fieldAnim(3.5)} className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4">
           <div className="flex items-center gap-2">
             <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
             <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 dark:text-amber-400">Security Verification</h4>
           </div>
           <p className="text-[10px] font-bold text-muted-foreground/60 dark:text-white/40 leading-relaxed uppercase tracking-wider">
             To change the password or sensitive details, please provide the current password for verification.
           </p>
           <Field
            icon={Lock}
            label="Current Password"
            name="currentPassword"
            type={showCurrent ? 'text' : 'password'}
            placeholder="Verify current password"
            idx={4}
            rightEl={
             <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="text-muted-foreground/40 dark:text-white/20 hover:text-foreground dark:hover:text-white/50 transition-colors">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Field
            icon={Lock}
            label={isEdit ? "New Password (Optional)" : "Password"}
            name="password"
            type={showPass ? 'text' : 'password'}
            placeholder="••••••••"
            idx={4}
            rightEl={
              <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground/40 dark:text-white/20 hover:text-foreground dark:hover:text-white/50 transition-colors">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          <PasswordStrength password={pwd} />
        </div>
        <Field
          icon={Lock}
          label={isEdit ? "Confirm New Password" : "Confirm Password"}
          name="confirmPassword"
          type={showConfirm ? 'text' : 'password'}
          placeholder="••••••••"
          idx={5}
          rightEl={
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-muted-foreground/40 dark:text-white/20 hover:text-foreground dark:hover:text-white/50 transition-colors">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />
      </div>

    </div>
  );
};

export default StepManager;
