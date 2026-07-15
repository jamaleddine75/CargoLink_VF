import React from 'react';
import { User, MapPin, Phone, Mail, UserCheck } from 'lucide-react';
import { AgencySettings } from '@/types';

interface ProfileInfoFormProps {
  formData?: Partial<AgencySettings> | null;
  errors?: Record<string, string> | null;
  onChange: (field: keyof AgencySettings, value: string) => void;
}

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({ formData = {}, errors = {}, onChange }) => {
  const safeFormData = formData ?? {};
  const safeErrors = errors ?? {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Agency Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <User className="w-4 h-4" /> Agency Name
        </label>
        <input
          Type="text"
          value={safeFormData.name ?? ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g. Global Logistics Solutions"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${safeErrors.name ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {safeErrors.name && <p className="text-xs text-red-500 mt-1 ml-1">{safeErrors.name}</p>}
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Contact Person
        </label>
        <input
          Type="text"
          value={safeFormData.contactPerson ?? ''}
          onChange={(e) => onChange('contactPerson', e.target.value)}
          placeholder="Full Name"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${safeErrors.contactPerson ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {safeErrors.contactPerson && <p className="text-xs text-red-500 mt-1 ml-1">{safeErrors.contactPerson}</p>}
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email Address
        </label>
        <input
          Type="email"
          value={safeFormData.email ?? ''}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="agency@example.com"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${safeErrors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {safeErrors.email && <p className="text-xs text-red-500 mt-1 ml-1">{safeErrors.email}</p>}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <Phone className="w-4 h-4" /> Phone Number
        </label>
        <input
          Type="tel"
          value={safeFormData.phone ?? ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+1 (555) 000-0000"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${safeErrors.phone ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {safeErrors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{safeErrors.phone}</p>}
      </div>

      {/* Physical Address */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Physical Address
        </label>
        <textarea
          value={safeFormData.address ?? ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Street address, City, Country, ZIP"
          rows={3}
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all resize-none
            ${safeErrors.address ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {safeErrors.address && <p className="text-xs text-red-500 mt-1 ml-1">{safeErrors.address}</p>}
      </div>
    </div>
  );
};

export default ProfileInfoForm;
