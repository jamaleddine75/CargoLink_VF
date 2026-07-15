import React, { useState } from 'react';
import { Shield, Key, Smartphone, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SecurityTab: React.FC = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("New passwords do not match");
      return;
    }
    
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setPasswords({ current: '', new: '', confirm: '' });
      toast.success('Password updated successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Password Update Section */}
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Key className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Change Password</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Make sure you use a long and secure password.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordChange} className="max-w-xl space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={passwords.current}
                  onChange={e => setPasswords({...passwords, current: e.target.value})}
                  className="pr-10 border-border bg-card"
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={passwords.new}
                  onChange={e => setPasswords({...passwords, new: e.target.value})}
                  className="pr-10 border-border bg-card"
                  placeholder="Minimum 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                className="border-border bg-card"
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                size="sm"
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Two-Factor Auth Section */}
      <Card className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
        <CardContent className="p-6 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <div>
              <h2 className="text-base font-semibold text-foreground">Two-Factor (2FA)</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Add an extra layer of security to your account.</p>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-600 dark:text-amber-400 text-[10px] font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              Not Enabled
            </div>
          </div>

          <div className="bg-muted/40 border border-border p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Two-factor authentication adds a layer of protection to your account by requiring additional proof during login.
            </div>
            <Button variant="outline" size="sm" className="whitespace-nowrap border-border">
              Enable 2FA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityTab;
