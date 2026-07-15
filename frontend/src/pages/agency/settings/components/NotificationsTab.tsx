import React, { useState } from 'react';
import { Bell, Mail, Smartphone, Truck, ShieldAlert, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      toast.success('Notification preferences saved');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">Notification Preferences</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choose what you want to be notified about and how.</p>
              </div>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="gap-2 self-start sm:self-auto"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Email Notifications</h3>
              </div>
              
              <div className="space-y-2">
                <ToggleItem 
                  label="New Orders" 
                  description="Order assignment notifications."
                  checked={preferences.email.newOrders}
                  onChange={() => handleToggle('email', 'newOrders')}
                  icon={<Truck className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Delivery Updates" 
                  description="Status changes of active deliveries."
                  checked={preferences.email.deliveries}
                  onChange={() => handleToggle('email', 'deliveries')}
                  icon={<Bell className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Issues & Alerts" 
                  description="Delivery failures or critical alerts."
                  checked={preferences.email.issues}
                  onChange={() => handleToggle('email', 'issues')}
                  icon={<ShieldAlert className="w-4 h-4" />}
                />
              </div>
            </div>

            {/* Push Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Push Notifications</h3>
              </div>
              
              <div className="space-y-2">
                <ToggleItem 
                  label="New Orders" 
                  description="Instant push for new missions."
                  checked={preferences.push.newOrders}
                  onChange={() => handleToggle('push', 'newOrders')}
                  icon={<Truck className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Delivery Updates" 
                  description="Real-time delivery status."
                  checked={preferences.push.deliveries}
                  onChange={() => handleToggle('push', 'deliveries')}
                  icon={<Bell className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Critical Alerts" 
                  description="Immediate notice for urgent issues."
                  checked={preferences.push.issues}
                  onChange={() => handleToggle('push', 'issues')}
                  icon={<ShieldAlert className="w-4 h-4" />}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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
    <label className="flex items-start justify-between cursor-pointer group p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
      <div className="flex gap-3">
        <div className="mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div>
          <div className="text-xs font-semibold text-foreground">{label}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">{description}</div>
        </div>
      </div>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`block w-9 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted border border-border'}`}></div>
        <div className={`absolute left-0.5 top-0.5 bg-background w-4 h-4 rounded-full border border-border transition-transform ${checked ? 'transform translate-x-4 border-primary' : ''}`}></div>
      </div>
    </label>
  );
};

export default NotificationsTab;
