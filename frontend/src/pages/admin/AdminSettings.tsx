import React, { useEffect, useState } from 'react';
import { 
  Settings as SettingsIcon, Shield, Bell, 
  Globe, Zap, Lock, Eye, EyeOff, 
  Save, RefreshCw, Smartphone, Mail,
  Cloud, Terminal, Cpu, Database, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import adminService from '@/services/api/adminService';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [settings, setSettings] = useState<Record<string, unknown>>({});

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      setLoadingSettings(true);
      try {
        const data = await adminService.getSettings();
        setSettings(data || {});
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await adminService.updateSettings(settings);
      toast.success('Settings saved');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loadingSettings) {
    return (
      <div className="space-y-8 pb-20">
        <div className="h-12 w-64 rounded-2xl bg-accent/20 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-accent/20 animate-pulse" />)}
        </div>
        <div className="h-64 rounded-2xl bg-accent/20 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-16 font-sans selection:bg-primary/30">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="rounded-full bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-widest">
                 Settings
              </Badge>
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
           </div>
           <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground leading-none">
              Global <span className="text-indigo-500">Settings</span>
           </h1>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 md:h-16 px-6 md:px-10 rounded-xl md:rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-foreground font-black uppercase text-[9px] md:text-[10px] tracking-widest shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 w-full md:w-auto"
        >
           <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-10">
         {/* Navigation Sidebar */}
         <div className="lg:col-span-1 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3.5 md:py-5 rounded-xl md:rounded-[24px] transition-all group",
                  activeTab === tab.id 
                    ? "bg-indigo-600 text-foreground shadow-2xl" 
                    : "text-foreground/40 hover:text-foreground hover:bg-accent/30"
                )}
              >
                 <tab.icon className={cn(
                   "w-5 h-5 transition-transform group-hover:scale-110",
                   activeTab === tab.id ? "text-foreground" : "text-indigo-500"
                 )} />
                 <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
         </div>

         {/* Settings Panel */}
         <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.2 }}
               >
                  <Card className="premium-glass p-6 md:p-10 border-none relative overflow-hidden rounded-2xl md:rounded-[2.5rem]">
                     {activeTab === 'general' && (
                       <div className="space-y-8 relative z-10">
                          <div className="space-y-5">
                             <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Cpu className="w-4 h-4 text-indigo-500" /> Identity
                             </h3>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-1">App Name</Label>
                                                    <Input
                                                       value={settings.appName || ''}
                                                       onChange={(e) => setSettings((prev) => ({ ...prev, appName: e.target.value }))}
                                                       className="h-14 bg-accent/30 border-border/40 rounded-2xl px-6 font-bold text-foreground focus:border-indigo-500/50"
                                                    />
                                </div>
                                <div className="space-y-3">
                                   <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-1">Support Email</Label>
                                                    <Input
                                                       value={settings.supportEmail || ''}
                                                       onChange={(e) => setSettings((prev) => ({ ...prev, supportEmail: e.target.value }))}
                                                       className="h-14 bg-accent/30 border-border/40 rounded-2xl px-6 font-bold text-foreground focus:border-indigo-500/50"
                                                    />
                                </div>
                             </div>
                          </div>

                          <div className="space-y-5 pt-8 border-t border-border/40">
                             <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Database className="w-4 h-4 text-emerald-500" /> Operations
                             </h3>
                             <div className="space-y-4">
                                <SettingToggle 
                                  icon={Zap} 
                                  title="Autonomous Dispatch" 
                                  description="Auto-assign drivers by proximity."
                                />
                                <SettingToggle 
                                  icon={Globe} 
                                  title="Multi-Regional Routing" 
                                  description="Enable cross-region routing."
                                />
                             </div>
                          </div>
                       </div>
                     )}

                     {activeTab === 'security' && (
                       <div className="space-y-8 relative z-10">
                          <div className="space-y-5">
                             <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Lock className="w-4 h-4 text-rose-500" /> Access
                             </h3>
                             <div className="space-y-4">
                                <SettingToggle 
                                  icon={Smartphone} 
                                  title="Two-Factor Authentication" 
                                  description="Require an extra login step."
                                  defaultChecked
                                />
                                <SettingToggle 
                                  icon={Shield} 
                                  title="Zero-Trust Architecture" 
                                  description="Re-authenticate on a fixed interval."
                                />
                             </div>
                          </div>

                          <div className="space-y-5 pt-8 border-t border-border/40">
                             <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-500" /> API
                             </h3>
                             <div className="space-y-3">
                                <Label className="text-[10px] font-black text-foreground/20 uppercase tracking-widest px-1">API Key</Label>
                                <div className="relative group">
                                   <Input 
                                     type={showApiKey ? "text" : "password"} 
                                     value="ck_live_9482_fba84920194837582910" 
                                     readOnly
                                     className="h-16 bg-accent/30 border-border/40 rounded-2xl pl-6 pr-14 font-mono text-sm text-indigo-400 focus:border-indigo-500/50" 
                                   />
                                   <button 
                                     onClick={() => setShowApiKey(!showApiKey)}
                                     className="absolute right-6 top-1/2 -translate-y-1/2 text-foreground/20 hover:text-foreground transition-colors"
                                   >
                                      {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                   </button>
                                </div>
                             </div>
                          </div>
                       </div>
                     )}

                     {activeTab === 'notifications' && (
                       <div className="space-y-10 relative z-10">
                          <div className="space-y-6">
                             <h3 className="text-sm font-black text-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                                <Mail className="w-4 h-4 text-amber-500" /> System Broadcasts
                             </h3>
                             <div className="space-y-6">
                                <SettingToggle 
                                  icon={Bell} 
                                  title="Client Status Updates" 
                                  description="Automatically notify customers when orders reach major transit milestones." 
                                  defaultChecked
                                />
                                <SettingToggle 
                                  icon={Zap} 
                                  title="Driver Mission Alerts" 
                                  description="Send high-priority haptic alerts to drivers for new assignments." 
                                  defaultChecked
                                />
                             </div>
                          </div>
                       </div>
                     )}


                     {/* Background Glow */}
                     <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 blur-[100px] rounded-full" />
                  </Card>
               </motion.div>
            </AnimatePresence>
         </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ icon: Icon, title, description, defaultChecked }: unknown) => (
  <div className="flex items-center justify-between gap-4 md:gap-10 group p-3 md:p-4 rounded-2xl md:rounded-3xl hover:bg-accent/30 transition-all">
     <div className="flex items-center gap-4 md:gap-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-accent/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
           <Icon className="w-4 md:w-5 h-4 md:h-5" />
        </div>
        <div>
           <p className="text-xs font-black text-foreground uppercase tracking-tight">{title}</p>
           <p className="text-[10px] text-foreground/20 font-bold uppercase tracking-widest mt-1 leading-relaxed max-w-md">{description}</p>
        </div>
     </div>
     <Switch defaultChecked={defaultChecked} className="data-[state=checked]:bg-indigo-600 border-none" />
  </div>
);


export default AdminSettings;
