import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Settings, Shield, Bell, CreditCard, ChevronRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AgencySettings as IAgencySettings } from '@/types';
import { agencyService } from '@/services/agencyService';
import { Card, CardContent } from '@/components/ui/card';

// Sub-components
import LogoUploadSection from './components/LogoUploadSection';
import ProfileInfoForm from './components/ProfileInfoForm';
import SettingsActions from './components/SettingsActions';
import SecurityTab from './components/SecurityTab';
import NotificationsTab from './components/NotificationsTab';
import BillingTab from './components/BillingTab';
import PageHeader from '@/components/shared/PageHeader';

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
      
      toast.success('Agency profile updated successfully');
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
        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground text-xs font-semibold animate-pulse">Initialisation des paramètres...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profil de l\'Agence', icon: Settings, description: 'Gérez l\'identité de l\'agence et les infos de contact.' },
    { id: 'security', label: 'Sécurité', icon: Shield, description: 'Gérez les mots de passe et la protection du compte.' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Configurez les alertes du système.' },
    { id: 'billing', label: 'Facturation & Paiements', icon: CreditCard, description: 'Gérez les coordonnées bancaires et retraits.' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <PageHeader
        title="Paramètres de l'Agence"
        description="Configurez la visibilité et les préférences opérationnelles de votre agence."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  w-full flex items-start gap-3.5 p-4 rounded-xl transition-all group text-left border
                  ${isActive 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                    : 'bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground'}
                `}
              >
                <div className={`p-2 rounded-lg transition-colors ${isActive ? 'bg-primary-foreground/15' : 'bg-muted group-hover:bg-muted/80'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs">{tab.label}</span>
                    {isActive && <ChevronRight className="w-3.5 h-3.5" />}
                  </div>
                  <p className={`text-[10px] mt-0.5 leading-relaxed truncate ${isActive ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}

          <Card className="border border-border bg-card shadow-sm mt-6">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-primary font-semibold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Fonctionnalités Premium</span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Votre agence a accès à toutes les fonctionnalités avancées du tableau de bord CargoLink.
              </p>
              <button className="text-[10px] font-semibold text-primary hover:underline">
                Détails de l'abonnement
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'profile' && (
              <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-6">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Informations Générales</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Ces informations seront visibles sur les factures et pour les chauffeurs.</p>
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
                </CardContent>
              </Card>
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
