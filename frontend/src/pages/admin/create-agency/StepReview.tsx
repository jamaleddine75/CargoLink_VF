import React from 'react';
import { motion } from 'framer-motion';
import { User, Building2, Globe, Activity, Edit2, MapPin, Clock, DollarSign, Zap, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ManagerData, AgencyData, LocationData, OperationsData } from './schemas';

interface Props {
  manager: ManagerData;
  agency: AgencyData;
  location: LocationData;
  operations: OperationsData;
  onGoToStep: (step: number) => void;
  mode?: 'create' | 'edit';
}


const Section = ({ icon: Icon, title, color, stepIdx, onEdit, children }: unknown) => (
  <motion.div
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: stepIdx * 0.08 }}
    className="p-6 bg-card/60 dark:bg-white/[0.02] border border-border/40 dark:border-white/[0.06] rounded-3xl space-y-4 hover:bg-accent/20 dark:hover:bg-white/[0.03] transition-all"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-black uppercase tracking-tight text-foreground dark:text-white">{title}</h4>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onEdit(stepIdx)}
        className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 dark:text-white/20 hover:text-primary hover:bg-primary/10 rounded-xl gap-1.5 h-8">
        <Edit2 className="w-3 h-3" /> Edit
      </Button>
    </div>
    <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">{children}</div>
  </motion.div>
);

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-0.5">
    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 dark:text-white/15">{label}</p>
    <p className="text-xs font-bold text-foreground dark:text-white/70 truncate">{value || '—'}</p>
  </div>
);

const StepReview: React.FC<Props> = ({ manager, agency, location, operations, onGoToStep, mode = 'create' }) => {
  const isEdit = mode === 'edit';
  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Check className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tight text-foreground dark:text-white">{isEdit ? 'Review Changes' : 'Review & Confirm'}</h3>
            <p className="text-[10px] font-bold text-muted-foreground dark:text-white/25 uppercase tracking-widest">{isEdit ? 'Verify updated details before saving' : 'Verify all details before creating'}</p>
          </div>
        </div>
      </motion.div>


      {/* Manager */}
      <Section icon={User} title="Manager Information" color="bg-blue-500/10 text-blue-400 border-blue-500/20" stepIdx={0} onEdit={onGoToStep}>
        <Row label="Full Name" value={manager.fullName} />
        <Row label="Email" value={manager.email} />
        <Row label="Phone" value={manager.phone} />
        <Row label="Role" value={manager.role || 'AGENCY_MANAGER'} />
      </Section>

      {/* Agency */}
      <Section icon={Building2} title="Agency Details" color="bg-indigo-500/10 text-indigo-400 border-indigo-500/20" stepIdx={1} onEdit={onGoToStep}>
        <Row label="Agency Name" value={agency.name} />
        <Row label="Code" value={agency.code} />
        <Row label="City" value={agency.city} />
        <Row label="Sector" value={agency.sector} />
        <Row label="Address" value={agency.address} />
        <Row label="Type" value={agency.agencyType} />
        <Row label="Max Drivers" value={agency.maxDrivers} />
        <Row label="Max Orders/Day" value={agency.maxDailyOrders} />
        {agency.description && <div className="col-span-2"><Row label="Description" value={agency.description} /></div>}
      </Section>

      {/* Location */}
      <Section icon={Globe} title="Map & Location" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" stepIdx={2} onEdit={onGoToStep}>
        <Row label="Latitude" value={location.lat?.toFixed(6)} />
        <Row label="Longitude" value={location.lng?.toFixed(6)} />
        {location.fullAddress && <div className="col-span-2"><Row label="Address" value={location.fullAddress} /></div>}
      </Section>

      {/* Operations */}
      <Section icon={Activity} title="Operational Settings" color="bg-amber-500/10 text-amber-400 border-amber-500/20" stepIdx={3} onEdit={onGoToStep}>
        <Row label="Hours" value={`${operations.openingHour} — ${operations.closingHour}`} />
        <Row label="Working Days" value={operations.workingDays?.join(', ')} />
        <Row label="Salary" value={`${operations.salary} MAD`} />
        <Row label="Commission" value={`${operations.commissionRate}%`} />
        <Row label="Bonus" value={`${operations.bonus} MAD`} />
        <Row label="Auto-Dispatch" value={operations.autoDispatch ? 'Enabled' : 'Disabled'} />
        <Row label="Staff Capacity" value={`${operations.maxEmployees} employees`} />
        <Row label="Max Deliveries" value={operations.maxConcurrentDeliveries} />
        <Row label="Status" value={operations.operationalStatus} />
      </Section>
    </div>
  );
};

export default StepReview;
