import React from 'react';
import { UseFormReturn, Controller } from 'react-hook-form';
import { OperationsData, WORKING_DAYS, STATUS_OPTIONS } from './schemas';
import { motion } from 'framer-motion';
import { Clock, Calendar, DollarSign, Percent, Zap, Layers, Activity, Gift, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const anim = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0, transition: { delay: i * 0.05 } },
});

interface Props {
  form: UseFormReturn<OperationsData>;
}

const StepOperations: React.FC<Props> = ({ form }) => {
  const { register, control, watch, setValue, formState: { errors } } = form;
  const workingDays = watch('workingDays') || [];

  const toggleDay = (day: string) => {
    const current = workingDays;
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    setValue('workingDays', next);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white">Operational Settings</h3>
            <p className="text-[10px] font-bold text-muted-foreground/70 dark:text-white/25 uppercase tracking-widest">Configure schedules, finances, and dispatch</p>
          </div>
        </div>
      </motion.div>

      {/* Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div {...anim(0)} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400/60 ml-1 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Opening Hour
          </label>
          <Input type="time" {...register('openingHour')}
            className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 font-bold text-sm text-foreground dark:text-white focus:border-amber-500 focus:ring-0 shadow-sm" />
        </motion.div>
        <motion.div {...anim(1)} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400/60 ml-1 flex items-center gap-2">
            <Clock className="w-3 h-3" /> Closing Hour
          </label>
          <Input type="time" {...register('closingHour')}
            className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 font-bold text-sm text-foreground dark:text-white focus:border-amber-500 focus:ring-0 shadow-sm" />
        </motion.div>
      </div>

      {/* Working Days */}
      <motion.div {...anim(2)} className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400/60 ml-1 flex items-center gap-2">
          <Calendar className="w-3 h-3" /> Working Days
        </label>
        <div className="flex flex-wrap gap-2">
          {WORKING_DAYS.map(day => (
            <button key={day} type="button" onClick={() => toggleDay(day)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                workingDays.includes(day)
                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30 shadow-lg shadow-amber-500/5'
                  : 'bg-accent/20 dark:bg-white/[0.02] text-muted-foreground/40 dark:text-white/20 border-border/40 dark:border-white/[0.04] hover:border-border/60 dark:hover:border-white/10'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Financial */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <motion.div {...anim(3)} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400/60 ml-1 flex items-center gap-2">
            <DollarSign className="w-3 h-3" /> Manager Salary (MAD)
          </label>
          <Input type="number" {...register('salary', { valueAsNumber: true })} placeholder="5000"
            className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 font-bold text-sm text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/15 focus:border-amber-500 focus:ring-0 shadow-sm" />
        </motion.div>

        <motion.div {...anim(4)} className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400/60 ml-1 flex items-center gap-2">
            <Percent className="w-3 h-3" /> Commission Rate
          </label>
          <div className="p-4 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl space-y-3 shadow-sm">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{watch('commissionRate') || 15}%</span>
            <Slider
              value={[watch('commissionRate') || 15]}
              onValueChange={([v]) => setValue('commissionRate', v)}
              min={0} max={50} step={1} className="w-full"
            />
          </div>
        </motion.div>

        <motion.div {...anim(5)} className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400/60 ml-1 flex items-center gap-2">
            <Gift className="w-3 h-3" /> Bonus (MAD)
          </label>
          <Input type="number" {...register('bonus', { valueAsNumber: true })} placeholder="0"
            className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl pl-5 font-bold text-sm text-foreground dark:text-white placeholder:text-muted-foreground/40 dark:placeholder:text-white/15 focus:border-amber-500 focus:ring-0 shadow-sm" />
        </motion.div>
      </div>

      {/* Dispatch & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div {...anim(6)} className="p-6 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-black text-foreground dark:text-white uppercase tracking-tight">Auto-Dispatch</p>
                <p className="text-[9px] text-muted-foreground/40 dark:text-white/25 font-bold uppercase tracking-widest">Assign drivers automatically</p>
              </div>
            </div>
            <Controller
              control={control}
              name="autoDispatch"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
        </motion.div>

        <motion.div {...anim(7)} className="space-y-4">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400/60 ml-1 flex items-center gap-2">
            <Layers className="w-3 h-3" /> Max Concurrent Deliveries
          </label>
          <div className="p-4 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl space-y-3 shadow-sm">
            <span className="text-xl font-black text-foreground dark:text-white">{watch('maxConcurrentDeliveries') || 5}</span>
            <Slider
              value={[watch('maxConcurrentDeliveries') || 5]}
              onValueChange={([v]) => setValue('maxConcurrentDeliveries', v)}
              min={1} max={20} step={1} className="w-full"
            />
          </div>
        </motion.div>
      </div>

      {/* Staff Capacity */}
      <motion.div {...anim(8)} className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60 ml-1 flex items-center gap-2">
          <Users className="w-3 h-3" /> Staff Capacity
        </label>
        <div className="p-5 bg-white dark:bg-white/[0.03] border border-border dark:border-white/[0.06] rounded-2xl space-y-4 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="text-2xl font-black text-foreground dark:text-white">{watch('maxEmployees') || 10}</span>
            <span className="text-[9px] font-black text-muted-foreground/40 dark:text-white/20 uppercase tracking-widest">Employees</span>
          </div>
          <Slider
            value={[watch('maxEmployees') || 10]}
            onValueChange={([v]) => setValue('maxEmployees', v)}
            min={1} max={100} step={1}
            className="w-full"
          />
          <p className="text-[10px] font-bold text-muted-foreground/40 dark:text-white/20 leading-relaxed" dir="rtl">
            حدد العدد الأقصى ديال الموظفين اللي تقدر الوكالة تسيرهم
          </p>
        </div>
      </motion.div>

      <motion.div {...anim(10)} className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60 ml-1 flex items-center gap-2">
          <Activity className="w-3 h-3" /> Operational Status
        </label>
        <Controller
          control={control}
          name="operationalStatus"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="h-14 bg-white dark:bg-white/[0.03] border-border dark:border-white/[0.06] rounded-2xl font-bold text-sm text-foreground dark:text-white focus:border-amber-500 focus:ring-0 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card dark:bg-[#0c1425] border-border/40 dark:border-white/10 rounded-xl">
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s} value={s} className="font-bold text-sm text-foreground/80 dark:text-white/80 focus:bg-amber-500/20 focus:text-foreground dark:focus:text-white rounded-lg">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </motion.div>
    </div>
  );
};

export default StepOperations;
