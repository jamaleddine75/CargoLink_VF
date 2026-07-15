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

  const handleToggle = (Type: 'email' | 'push', key: string) => {
    setPreferences(prev => ({
      ...prev,
      [Type]: {
        ...prev[Type],
        [key]: !prev[Type][key as keyof Typeof prev[Typeof Type]]
      }
    }));
  };

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Préférences de notification enregistrées');
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
                <h2 className="text-base font-semibold text-foreground">Préférences de Notification</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choisissez ce dont vous voulez être notifié et comment.</p>
              </div>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={isSaving}
              size="sm"
              className="gap-2 self-start sm:self-auto"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Enregistrer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* Email Notifications */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Notifications par Email</h3>
              </div>
              
              <div className="space-y-2">
                <ToggleItem 
                  label="Nouvelles Commandes" 
                  description="Notifications d'assignation de commande."
                  checked={preferences.email.newOrders}
                  onChange={() => handleToggle('email', 'newOrders')}
                  icon={<Truck className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Mises à jour des Livraisons" 
                  description="Changements de Status des livraisons actives."
                  checked={preferences.email.deliveries}
                  onChange={() => handleToggle('email', 'deliveries')}
                  icon={<Bell className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Problèmes & Alerts" 
                  description="Échecs de livraisons ou Alerts critiques."
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
                <h3 className="text-sm font-semibold text-foreground">Notifications Push</h3>
              </div>
              
              <div className="space-y-2">
                <ToggleItem 
                  label="Nouvelles Commandes" 
                  description="Push instantané pour nouvelles missions."
                  checked={preferences.push.newOrders}
                  onChange={() => handleToggle('push', 'newOrders')}
                  icon={<Truck className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Mises à jour des Livraisons" 
                  description="Status de livraison en temps réel."
                  checked={preferences.push.deliveries}
                  onChange={() => handleToggle('push', 'deliveries')}
                  icon={<Bell className="w-4 h-4" />}
                />
                <ToggleItem 
                  label="Alerts Critiques" 
                  description="Avis immédiats en cas de problème urgent."
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
        <input Type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div className={`block w-9 h-5 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted border border-border'}`}></div>
        <div className={`absolute left-0.5 top-0.5 bg-background w-4 h-4 rounded-full border border-border transition-transform ${checked ? 'transform translate-x-4 border-primary' : ''}`}></div>
      </div>
    </label>
  );
};

export default NotificationsTab;
