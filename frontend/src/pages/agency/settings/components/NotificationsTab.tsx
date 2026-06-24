import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Truck, ShieldAlert, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

const NotificationsTab: React.FC = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    email: {
      newOrders: true,
      deliveries: true,
      issues: true,
      billing: true,
      marketing: false,
    },
    push: {
      newOrders: true,
      deliveries: true,
      issues: true,
      messages: true,
    }
  });

  const handleToggle = (type: 'email' | 'push', key: string) => {
    setPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: !prev[type][key as keyof typeof prev[typeof type]]
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Notification preferences updated');
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/30 border border-border/40 rounded-3xl p-8 backdrop-blur-sm shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <Bell className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-foreground mb-1">Notification Preferences</h2>
              <p className="text-sm text-slate-400">Choose what you want to be notified about and how.</p>
            </div>
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Preferences
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Email Notifications */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Mail className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-200">Email Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <ToggleItem 
                label="New Orders" 
                description="Receive emails when new orders are assigned."
                checked={preferences.email.newOrders}
                onChange={() => handleToggle('email', 'newOrders')}
                icon={<Truck className="w-4 h-4" />}
              />
              <ToggleItem 
                label="Delivery Updates" 
                description="Status changes on active deliveries."
                checked={preferences.email.deliveries}
                onChange={() => handleToggle('email', 'deliveries')}
                icon={<Bell className="w-4 h-4" />}
              />
              <ToggleItem 
                label="Issues & Alerts" 
                description="Failed deliveries or driver issues."
                checked={preferences.email.issues}
                onChange={() => handleToggle('email', 'issues')}
                icon={<ShieldAlert className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Push Notifications */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <h3 className="font-semibold text-slate-200">Push Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <ToggleItem 
                label="New Orders" 
                description="Instant push for new order assignments."
                checked={preferences.push.newOrders}
                onChange={() => handleToggle('push', 'newOrders')}
                icon={<Truck className="w-4 h-4" />}
              />
              <ToggleItem 
                label="Delivery Updates" 
                description="Real-time status changes."
                checked={preferences.push.deliveries}
                onChange={() => handleToggle('push', 'deliveries')}
                icon={<Bell className="w-4 h-4" />}
              />
              <ToggleItem 
                label="Critical Alerts" 
                description="Immediate alerts for urgent issues."
                checked={preferences.push.issues}
                onChange={() => handleToggle('push', 'issues')}
                icon={<ShieldAlert className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ToggleItemProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
}

const ToggleItem: React.FC<ToggleItemProps> = ({ label, description, checked, onChange, icon }) => {
  return (
    <label className="flex items-start justify-between cursor-pointer group p-3 hover:bg-slate-800/50 rounded-xl transition-colors">
      <div className="flex gap-3">
        <div className="mt-0.5 text-slate-400 group-hover:text-indigo-400 transition-colors">
          {icon}
        </div>
        <div>
          <div className="font-medium text-slate-200 group-hover:text-white transition-colors">{label}</div>
          <div className="text-xs text-slate-500 mt-0.5">{description}</div>
        </div>
      </div>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-700'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'transform translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
};

export default NotificationsTab;
