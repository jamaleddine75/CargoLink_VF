import React from 'react';
import { User, MapPin, Phone, Mail, UserCheck } from 'lucide-react';
import { AgencySettings } from '@/types';

interface ProfileInfoFormProps {
  formData: Partial<AgencySettings>;
  errors: Record<string, string>;
  onChange: (field: keyof AgencySettings, value: string) => void;
}

const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({ formData, errors, onChange }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Agency Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <User className="w-4 h-4" /> Agency Name
        </label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => onChange('name', e.target.value)}
          placeholder="e.g. Global Logistics Solutions"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${errors.name ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1 ml-1">{errors.name}</p>}
      </div>

      {/* Contact Person */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <UserCheck className="w-4 h-4" /> Contact Person
        </label>
        <input
          type="text"
          value={formData.contactPerson || ''}
          onChange={(e) => onChange('contactPerson', e.target.value)}
          placeholder="Full Name"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${errors.contactPerson ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {errors.contactPerson && <p className="text-xs text-red-500 mt-1 ml-1">{errors.contactPerson}</p>}
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email Address
        </label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="agency@example.com"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${errors.email ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {errors.email && <p className="text-xs text-red-500 mt-1 ml-1">{errors.email}</p>}
      </div>

      {/* Phone Number */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <Phone className="w-4 h-4" /> Phone Number
        </label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+1 (555) 000-0000"
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all
            ${errors.phone ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {errors.phone && <p className="text-xs text-red-500 mt-1 ml-1">{errors.phone}</p>}
      </div>

      {/* Physical Address */}
      <div className="space-y-2 md:col-span-2">
        <label className="text-sm font-medium text-muted-foreground ml-1 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Physical Address
        </label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="Street address, City, Country, ZIP"
          rows={3}
          className={`
            w-full bg-background border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 transition-all resize-none
            ${errors.address ? 'border-red-500/50 focus:ring-red-500/20' : 'border-border/40 focus:ring-primary/20 focus:border-primary/50'}
          `}
        />
        {errors.address && <p className="text-xs text-red-500 mt-1 ml-1">{errors.address}</p>}
      </div>
    </div>
  );
};

export default ProfileInfoForm;
