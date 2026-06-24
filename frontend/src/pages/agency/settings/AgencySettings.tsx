import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, Lock, Globe, CreditCard, ChevronRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AgencySettings as IAgencySettings } from '@/types';
import { agencyService } from '@/services/agencyService';

// Sub-components
import LogoUploadSection from './components/LogoUploadSection';
import ProfileInfoForm from './components/ProfileInfoForm';
import SettingsActions from './components/SettingsActions';
import SecurityTab from './components/SecurityTab';
import NotificationsTab from './components/NotificationsTab';
import BillingTab from './components/BillingTab';
const AgencySettings: React.FC = () => {
  // State
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
  const [profile, setProfile] = useState<IAgencySettings | null>(null);
  const [formData, setFormData] = useState<Partial<IAgencySettings>>({});
  const [newLogo, setNewLogo] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch profile data
  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await agencyService.getProfile();
      setProfile(data);
      setFormData(data);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to fetch agency profile:', error);
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Handle input changes
  const handleInputChange = (field: keyof IAgencySettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleLogoChange = (file: File | null) => {
    setNewLogo(file);
    setHasChanges(true);
  };

  const handleReset = () => {
    if (profile) {
      setFormData(profile);
      setNewLogo(null);
      setErrors({});
      setHasChanges(false);
      toast.info('Changes discarded');
    }
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Agency name is required';
    if (!formData.contactPerson?.trim()) newErrors.contactPerson = 'Contact person is required';
    if (!formData.address?.trim()) newErrors.address = 'Physical address is required';
    if (!formData.phone?.trim()) newErrors.phone = 'Phone number is required';
    
    if (!formData.email?.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save profile
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please correct the errors before saving');
      return;
    }

    try {
      setIsSaving(true);

      // 1. Upload logo if changed
      let finalLogoUrl = profile?.logoUrl;
      if (newLogo) {
        finalLogoUrl = await agencyService.uploadLogo(newLogo);
      }

      // 2. Update profile info
      const updatedProfile = await agencyService.updateProfile({
        ...formData,
        logoUrl: finalLogoUrl
      });

      // 3. Update local state
      setProfile(updatedProfile);
      setFormData(updatedProfile);
      setNewLogo(null);
      setHasChanges(false);
      
      toast.success('Agency profile updated successfully', {
        icon: <Sparkles className="w-4 h-4 text-yellow-500" />
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-500/10 border-t-blue-500 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-500/50 animate-pulse" />
          </div>
        </div>
        <p className="text-slate-400 font-medium animate-pulse">Initializing Settings Engine...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Agency Profile', icon: Settings, description: 'Manage your agency identity and contact information.' },
    { id: 'security', label: 'Security', icon: Shield, description: 'Manage password and account protection.' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configure how you receive system alerts.' },
    { id: 'billing', label: 'Billing & Payouts', icon: CreditCard, description: 'Manage payment methods and withdrawal history.' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Settings className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-3xl font-black text-primary-foreground tracking-tight">Agency Settings</h1>
        </div>
        <p className="text-slate-400">Configure your agency presence and operational preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`
                  w-full flex items-start gap-4 p-4 rounded-2xl transition-all group text-left
                  ${activeTab === tab.id 
                    ? 'bg-blue-600 shadow-xl shadow-blue-600/10 text-primary-foreground' 
                    : tab.disabled 
                      ? 'opacity-40 cursor-not-allowed grayscale' 
                      : 'hover:bg-accent/30 text-slate-400 hover:text-foreground'}
                `}
              >
                <div className={`p-2 rounded-xl transition-colors ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-800 group-hover:bg-slate-700'}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{tab.label}</span>
                    {activeTab === tab.id && <ChevronRight className="w-4 h-4" />}
                  </div>
                  <p className={`text-xs mt-1 leading-relaxed ${activeTab === tab.id ? 'text-blue-100/70' : 'text-slate-500'}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}

          <div className="mt-8 p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-indigo-600/10 border border-blue-500/20">
            <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Pro Account Features</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Your agency currently has access to all premium dashboard features including advanced analytics.
            </p>
            <button className="text-[10px] uppercase font-black tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
              View Plan Details
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'profile' && (
              <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-primary-foreground mb-1">General Information</h2>
                  <p className="text-sm text-slate-500">This information will be displayed on invoices and to your assigned drivers.</p>
                </div>

                <LogoUploadSection 
                  currentLogoUrl={profile?.logoUrl} 
                  onLogoChange={handleLogoChange} 
                />

                <ProfileInfoForm 
                  formData={formData} 
                  errors={errors} 
                  onChange={handleInputChange} 
                />

                <SettingsActions 
                  onSave={handleSave} 
                  onReset={handleReset} 
                  isSaving={isSaving} 
                  hasChanges={hasChanges} 
                />
              </div>
            )}
            
            {activeTab === 'security' && <SecurityTab />}
            {activeTab === 'notifications' && <NotificationsTab />}
            {activeTab === 'billing' && <BillingTab />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AgencySettings;
