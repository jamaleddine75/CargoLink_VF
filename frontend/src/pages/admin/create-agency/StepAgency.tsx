import React from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { AgencyData, AGENCY_TYPES } from './schemas';
import { motion } from 'framer-motion';
import { Building2, Hash, MapPin, Layers, FileText, Truck, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.05 } },
});

interface Props {
  form: UseFormReturn<AgencyData>;
}

const StepAgency: React.FC<Props> = ({ form }) => {
  const { register, formState: { errors }, control, watch, setValue } = form;

  const Field = ({ icon: Icon, label, name, placeholder, idx, type = 'text' }: any) => (
    <motion.div {...anim(idx)} className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/60 ml-1 flex items-center gap-2">
        <Icon className="w-3 h-3" /> {label}
      </label>
      <Input
        type={type}
        placeholder={placeholder}
        {...register(name, type === 'number' ? { valueAsNumber: true } : undefined)}
        className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 font-bold text-sm text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/15 focus:border-blue-500 focus:ring-0 transition-all hover:border-blue-500/50 dark:hover:border-white/10 shadow-sm"
      />
      {(errors as any)[name] && (
        <p className="text-[10px] text-rose-400 font-bold ml-1">{(errors as any)[name]?.message}</p>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white">Agency Details</h3>
            <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/25 uppercase tracking-widest">Configure the agency profile</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field icon={Building2} label="Agency Name" name="name" placeholder="Express Logistics" idx={0} />
        <Field icon={Hash} label="Agency Code" name="code" placeholder="EXP-001" idx={1} />
        <Field icon={MapPin} label="City" name="city" placeholder="Casablanca" idx={2} />
        <Field icon={Layers} label="Sector / Region" name="sector" placeholder="Maarif" idx={3} />
      </div>

      <Field icon={MapPin} label="Exact Address" name="address" placeholder="123 Boulevard Mohammed V" idx={4} />

      <motion.div {...anim(5)} className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/60 ml-1 flex items-center gap-2">
          <Layers className="w-3 h-3" /> Agency Type
        </label>
        <Controller
          control={control}
          name="agencyType"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl font-bold text-sm text-foreground dark:text-white focus:border-blue-500 focus:ring-0 shadow-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-card dark:bg-[#0c1425] border-border/40 dark:border-white/10 rounded-xl">
                {AGENCY_TYPES.map(t => (
                  <SelectItem key={t} value={t} className="font-bold text-sm text-foreground/80 dark:text-white/80 focus:bg-primary/20 dark:focus:bg-blue-500/20 focus:text-foreground dark:focus:text-white rounded-lg">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </motion.div>

      <motion.div {...anim(6)} className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600/80 dark:text-blue-400/60 ml-1 flex items-center gap-2">
          <FileText className="w-3 h-3" /> Description
        </label>
        <Textarea
          placeholder="Brief description of the agency..."
          {...register('description')}
          className="min-h-[100px] bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl p-5 font-bold text-sm text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/15 focus:border-blue-500 focus:ring-0 resize-none shadow-sm"
        />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div {...anim(7)} className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 dark:text-blue-400/60 ml-1 flex items-center gap-2">
            <Truck className="w-3 h-3" /> Max Drivers Capacity
          </label>
          <div className="p-5 bg-accent/20 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.06] rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-foreground dark:text-white">{watch('maxDrivers') || 10}</span>
              <span className="text-[9px] font-black text-muted-foreground/30 dark:text-white/20 uppercase tracking-widest">Drivers</span>
            </div>
            <Slider
              value={[watch('maxDrivers') || 10]}
              onValueChange={([v]) => setValue('maxDrivers', v)}
              min={1} max={200} step={1}
              className="w-full"
            />
          </div>
        </motion.div>

        <motion.div {...anim(8)} className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500/70 dark:text-blue-400/60 ml-1 flex items-center gap-2">
            <Package className="w-3 h-3" /> Max Daily Orders
          </label>
          <div className="p-5 bg-accent/20 dark:bg-white/[0.03] border border-border/40 dark:border-white/[0.06] rounded-2xl space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-black text-foreground dark:text-white">{watch('maxDailyOrders') || 100}</span>
              <span className="text-[9px] font-black text-muted-foreground/30 dark:text-white/20 uppercase tracking-widest">Orders/Day</span>
            </div>
            <Slider
              value={[watch('maxDailyOrders') || 100]}
              onValueChange={([v]) => setValue('maxDailyOrders', v)}
              min={10} max={2000} step={10}
              className="w-full"
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StepAgency;
